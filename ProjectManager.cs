using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Windows.Forms;

internal static class ProjectManager
{
    private static readonly string Root = AppDomain.CurrentDomain.BaseDirectory;
    private static readonly Color Background = Color.FromArgb(28, 29, 26);
    private static readonly Color Foreground = Color.FromArgb(235, 231, 218);
    private static readonly Color Gold = Color.FromArgb(207, 166, 97);
    private static readonly RichTextBox Output = new RichTextBox();
    private static readonly Label ApiStatus = new Label();
    private static readonly Label SiteStatus = new Label();
    private static readonly Label Hint = new Label();
    private static readonly Button StartButton = new Button();
    private static readonly Button StopButton = new Button();
    private static readonly Button OpenButton = new Button();
    private static readonly Button UpdateButton = new Button();
    private static readonly Button PushButton = new Button();
    private static readonly Timer StatusTimer = new Timer();
    private static Process BackendProcess;
    private static Process FrontendProcess;
    private static Process DependencyProcess;
    private static bool Closing;

    [STAThread]
    private static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(BuildWindow());
    }

    private static Form BuildWindow()
    {
        Form form = new Form();
        form.Text = "Sector: Vermillion — управление проектом";
        form.StartPosition = FormStartPosition.CenterScreen;
        form.ClientSize = new Size(850, 455);
        form.MinimumSize = new Size(866, 494);
        form.Font = new Font("Segoe UI", 10F);
        form.BackColor = Background;
        form.ForeColor = Foreground;

        Label title = new Label();
        title.Text = "SECTOR: VERMILLION";
        title.Font = new Font("Segoe UI Semibold", 18F);
        title.ForeColor = Gold;
        title.Location = new Point(24, 18);
        title.AutoSize = true;
        form.Controls.Add(title);

        Label subtitle = new Label();
        subtitle.Text = "Управление локальным сайтом и API";
        subtitle.Location = new Point(27, 56);
        subtitle.AutoSize = true;
        form.Controls.Add(subtitle);

        SetupStatus(ApiStatus, 28, 92);
        SetupStatus(SiteStatus, 28, 122);
        form.Controls.Add(ApiStatus);
        form.Controls.Add(SiteStatus);

        SetupButton(StartButton, "Запустить", 28, 165, 145, Color.FromArgb(125, 73, 47));
        SetupButton(StopButton, "Остановить", 184, 165, 145, Color.FromArgb(60, 60, 54));
        SetupButton(OpenButton, "Открыть сайт", 340, 165, 145, Color.FromArgb(60, 60, 54));
        SetupButton(UpdateButton, "Обновить зависимости", 496, 165, 160, Color.FromArgb(60, 60, 54));
        SetupButton(PushButton, "Отправить в GitHub", 667, 165, 155, Color.FromArgb(46, 83, 68));
        StopButton.Enabled = false;
        OpenButton.Enabled = false;
        form.Controls.Add(PushButton);
        form.Controls.Add(StartButton);
        form.Controls.Add(StopButton);
        form.Controls.Add(OpenButton);
        form.Controls.Add(UpdateButton);

        Hint.Text = "Вывод запуска и установки зависимостей появится ниже.";
        Hint.Location = new Point(28, 220);
        Hint.Size = new Size(790, 26);
        Hint.ForeColor = Color.FromArgb(172, 170, 157);
        form.Controls.Add(Hint);

        Output.Location = new Point(28, 250);
        Output.Size = new Size(790, 174);
        Output.ReadOnly = true;
        Output.BackColor = Color.FromArgb(17, 18, 16);
        Output.ForeColor = Color.FromArgb(213, 210, 198);
        Output.BorderStyle = BorderStyle.FixedSingle;
        Output.Font = new Font("Consolas", 9F);
        form.Controls.Add(Output);

        StartButton.Click += delegate { StartProject(); };
        StopButton.Click += delegate { StopProject(); };
        OpenButton.Click += delegate { OpenSite(); };
        UpdateButton.Click += delegate { UpdateDependencies(); };
        PushButton.Click += delegate { PushToGitHub(); };
        form.FormClosing += delegate { Closing = true; StopOwnedProcesses(); };

        StatusTimer.Interval = 1000;
        StatusTimer.Tick += delegate { RefreshStatus(); };
        StatusTimer.Start();
        return form;
    }

    private static void SetupStatus(Label label, int x, int y)
    {
        label.Location = new Point(x, y);
        label.Size = new Size(630, 26);
    }

    private static void SetupButton(Button button, string text, int x, int y, int width, Color color)
    {
        button.Text = text;
        button.Location = new Point(x, y);
        button.Size = new Size(width, 42);
        button.FlatStyle = FlatStyle.Flat;
        button.BackColor = color;
        button.ForeColor = Color.White;
        button.Cursor = Cursors.Hand;
    }

    private static Process StartCommand(string folder, string command)
    {
        Process process = new Process();
        process.StartInfo = new ProcessStartInfo
        {
            FileName = Environment.GetEnvironmentVariable("ComSpec") ?? "cmd.exe",
            Arguments = "/d /s /c \"" + command + "\"",
            WorkingDirectory = Path.Combine(Root, folder),
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
        };
        AttachOutput(process);
        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        return process;
    }

    private static void AttachOutput(Process process)
    {
        DataReceivedEventHandler handler = delegate(object sender, DataReceivedEventArgs e)
        {
            if (e.Data == null || Closing || Output.IsDisposed) return;
            try
            {
                Output.BeginInvoke((MethodInvoker)delegate
                {
                    if (!Output.IsDisposed)
                    {
                        Output.AppendText(e.Data + Environment.NewLine);
                        Output.SelectionStart = Output.TextLength;
                        Output.ScrollToCaret();
                    }
                });
            }
            catch (InvalidOperationException) { }
        };
        process.OutputDataReceived += handler;
        process.ErrorDataReceived += handler;
    }

    private static void StartProject()
    {
        if (!HasNpm())
        {
            MessageBox.Show("Node.js и npm не найдены. Установи Node.js 18 или новее.", "Не найден Node.js", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }
        if (!Directory.Exists(Path.Combine(Root, "backend", "node_modules")) || !Directory.Exists(Path.Combine(Root, "frontend", "node_modules")))
        {
            MessageBox.Show("Сначала нажми «Обновить зависимости» в этом окне.", "Нужны зависимости", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }
        if (PortIsOpen(3000) || PortIsOpen(4000))
        {
            MessageBox.Show("Порт 3000 или 4000 уже занят. Останови предыдущий запуск или закрой приложение, которое использует этот порт.", "Порт уже занят", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        Output.Clear();
        try
        {
            BackendProcess = StartCommand("backend", "npm run dev");
            FrontendProcess = StartCommand("frontend", "npm start");
            Hint.Text = "Запуск выполняется. Сайт откроется, когда порт 3000 станет доступен.";
        }
        catch (Exception ex)
        {
            StopOwnedProcesses();
            MessageBox.Show("Не удалось запустить проект:\r\n" + ex.Message, "Ошибка запуска", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private static void StopProject()
    {
        StopTree(FrontendProcess);
        StopTree(BackendProcess);
        FrontendProcess = null;
        BackendProcess = null;
        Hint.Text = "Запущенные этим приложением сервер и сайт остановлены.";
    }

    private static void StopOwnedProcesses()
    {
        StopProject();
        StopTree(DependencyProcess);
        DependencyProcess = null;
    }

    private static void StopTree(Process process)
    {
        if (process == null) return;
        try
        {
            if (!process.HasExited)
            {
                Process killer = Process.Start(new ProcessStartInfo
                {
                    FileName = "taskkill.exe",
                    Arguments = "/PID " + process.Id + " /T /F",
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                });
                if (killer != null) killer.WaitForExit(3000);
            }
        }
        catch { }
        try { process.Dispose(); } catch { }
    }

    private static void UpdateDependencies()
    {
        if (!HasNpm())
        {
            MessageBox.Show("Node.js и npm не найдены. Установи Node.js 18 или новее.", "Не найден Node.js", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }
        if (PortIsOpen(3000) || PortIsOpen(4000))
        {
            MessageBox.Show("Сначала останови сайт и API кнопкой «Остановить».", "Сначала останови проект", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }

        Output.Clear();
        Hint.Text = "Устанавливаю зависимости backend, затем frontend…";
        UpdateButton.Enabled = false;
        StartButton.Enabled = false;
        PushButton.Enabled = false;
        try
        {
            DependencyProcess = StartCommand(".", "npm --prefix backend ci && npm --prefix frontend ci");
        }
        catch (Exception ex)
        {
            DependencyProcess = null;
            UpdateButton.Enabled = true;
            StartButton.Enabled = true;
            PushButton.Enabled = true;
            Hint.Text = "Не удалось запустить установку зависимостей.";
            MessageBox.Show(ex.Message, "Ошибка npm", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private static bool HasNpm()
    {
        string path = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (string part in path.Split(Path.PathSeparator))
            if (File.Exists(Path.Combine(part.Trim('"'), "npm.cmd"))) return true;
        return false;
    }

    private static bool PortIsOpen(int port)
    {
        try
        {
            using (TcpClient client = new TcpClient())
            {
                IAsyncResult result = client.BeginConnect("127.0.0.1", port, null, null);
                if (!result.AsyncWaitHandle.WaitOne(120)) return false;
                client.EndConnect(result);
                return true;
            }
        }
        catch { return false; }
    }

    private static void OpenSite()
    {
        try { Process.Start("http://localhost:3000"); }
        catch (Exception ex) { MessageBox.Show(ex.Message, "Не удалось открыть сайт", MessageBoxButtons.OK, MessageBoxIcon.Error); }
    }

    private static void RefreshStatus()
    {
        bool api = PortIsOpen(4000);
        bool site = PortIsOpen(3000);
        ApiStatus.Text = api ? "● API: работает  ·  http://localhost:4000" : "○ API: остановлен  ·  порт 4000";
        ApiStatus.ForeColor = api ? Color.LightGreen : Color.LightGray;
        SiteStatus.Text = site ? "● Сайт: работает  ·  http://localhost:3000" : "○ Сайт: остановлен  ·  порт 3000";
        SiteStatus.ForeColor = site ? Color.LightGreen : Color.LightGray;
        StopButton.Enabled = BackendProcess != null || FrontendProcess != null;
        OpenButton.Enabled = site;

        if (DependencyProcess != null && DependencyProcess.HasExited)
        {
            int exitCode = DependencyProcess.ExitCode;
            DependencyProcess.Dispose();
            DependencyProcess = null;
            UpdateButton.Enabled = true;
            StartButton.Enabled = true;
            PushButton.Enabled = true;
            Hint.Text = exitCode == 0 ? "Зависимости backend и frontend обновлены." : "Установка завершилась с ошибкой. Подробности показаны в выводе.";
        }
        if (BackendProcess != null && BackendProcess.HasExited) BackendProcess = null;
        if (FrontendProcess != null && FrontendProcess.HasExited) FrontendProcess = null;
    }

    private static void PushToGitHub()
    {
        if (DependencyProcess != null)
        {
            MessageBox.Show("Дождись завершения обновления зависимостей.", "Идёт установка", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        CommandResult status = RunGit("status", "--short");
        if (status.ExitCode != 0)
        {
            MessageBox.Show("Не удалось проверить Git:\r\n" + status.Output, "Ошибка Git", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }
        if (String.IsNullOrWhiteSpace(status.Output))
        {
            MessageBox.Show("Нет изменений для отправки.", "GitHub", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        string branch = RunGit("branch", "--show-current").Output.Trim();
        if (String.IsNullOrWhiteSpace(branch))
        {
            MessageBox.Show("Не удалось определить текущую ветку Git.", "Ошибка Git", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return;
        }

        string message = AskCommitMessage();
        if (message == null) return;
        string fileList = status.Output.Trim();
        string[] lines = fileList.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length > 35)
            fileList = String.Join(Environment.NewLine, lines, 0, 35) + Environment.NewLine + "… и ещё " + (lines.Length - 35) + " файлов";

        DialogResult confirm = MessageBox.Show(
            "Будут добавлены все изменения в рабочей папке, сохранены коммитом и отправлены в origin/" + branch + ".\r\n\r\n" +
            "Коммит: " + message + "\r\n\r\nИзменённые файлы:\r\n" + fileList + "\r\n\r\nПродолжить?",
            "Подтверждение отправки в GitHub", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
        if (confirm != DialogResult.Yes) return;

        Output.Clear();
        Hint.Text = "Отправляю изменения в GitHub… приложение останется отзывчивым.";
        PushButton.Enabled = false;
        UpdateButton.Enabled = false;

        BackgroundWorker worker = new BackgroundWorker();
        worker.DoWork += delegate(object sender, DoWorkEventArgs e)
        {
            string[] values = (string[])e.Argument;
            StringBuilder log = new StringBuilder();
            CommandResult add = RunGit("add", "--all");
            log.AppendLine(add.Output);
            if (add.ExitCode != 0) throw new InvalidOperationException("git add завершился с ошибкой.\r\n" + log);

            CommandResult commit = RunGit("commit", "-m", values[1]);
            log.AppendLine(commit.Output);
            if (commit.ExitCode != 0) throw new InvalidOperationException("git commit завершился с ошибкой.\r\n" + log);

            CommandResult push = RunGit("push", "-u", "origin", values[0]);
            log.AppendLine(push.Output);
            if (push.ExitCode != 0) throw new InvalidOperationException("git push завершился с ошибкой.\r\n" + log);
            e.Result = log.ToString();
        };
        worker.RunWorkerCompleted += delegate(object sender, RunWorkerCompletedEventArgs e)
        {
            PushButton.Enabled = true;
            UpdateButton.Enabled = true;
            if (e.Error != null)
            {
                Output.AppendText(e.Error.Message + Environment.NewLine);
                Hint.Text = "Отправка не завершилась. Подробности показаны в выводе.";
                MessageBox.Show(e.Error.Message, "Не удалось отправить изменения", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            else
            {
                Output.AppendText(Convert.ToString(e.Result));
                Hint.Text = "Изменения отправлены в GitHub.";
                MessageBox.Show("Коммит создан и отправлен в origin/" + branch + ".", "GitHub", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        };
        worker.RunWorkerAsync(new[] { branch, message });
    }

    private static string AskCommitMessage()
    {
        using (Form dialog = new Form())
        using (TextBox input = new TextBox())
        using (Button send = new Button())
        using (Button cancel = new Button())
        {
            dialog.Text = "Сообщение коммита";
            dialog.StartPosition = FormStartPosition.CenterParent;
            dialog.FormBorderStyle = FormBorderStyle.FixedDialog;
            dialog.ClientSize = new Size(440, 132);
            dialog.MinimizeBox = false;
            dialog.MaximizeBox = false;
            dialog.ShowInTaskbar = false;
            dialog.BackColor = Background;
            dialog.ForeColor = Foreground;

            Label label = new Label();
            label.Text = "Кратко опиши обновление:";
            label.Location = new Point(16, 14);
            label.AutoSize = true;
            dialog.Controls.Add(label);

            input.Text = "Обновление проекта";
            input.Location = new Point(16, 42);
            input.Size = new Size(408, 25);
            dialog.Controls.Add(input);

            send.Text = "Продолжить";
            send.Location = new Point(220, 82);
            send.Size = new Size(100, 32);
            send.DialogResult = DialogResult.OK;
            dialog.Controls.Add(send);

            cancel.Text = "Отмена";
            cancel.Location = new Point(324, 82);
            cancel.Size = new Size(100, 32);
            cancel.DialogResult = DialogResult.Cancel;
            dialog.Controls.Add(cancel);
            dialog.AcceptButton = send;
            dialog.CancelButton = cancel;

            if (dialog.ShowDialog() != DialogResult.OK) return null;
            string result = input.Text.Trim();
            return String.IsNullOrWhiteSpace(result) ? null : result;
        }
    }

    private static CommandResult RunGit(params string[] arguments)
    {
        Process process = new Process();
        StringBuilder output = new StringBuilder();
        object sync = new object();
        process.StartInfo = new ProcessStartInfo
        {
            FileName = "git.exe",
            Arguments = String.Join(" ", Array.ConvertAll(arguments, QuoteArgument)),
            WorkingDirectory = Root,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
        };
        DataReceivedEventHandler append = delegate(object sender, DataReceivedEventArgs e)
        {
            if (e.Data == null) return;
            lock (sync) output.AppendLine(e.Data);
        };
        process.OutputDataReceived += append;
        process.ErrorDataReceived += append;
        try
        {
            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();
            process.WaitForExit();
            process.WaitForExit();
            lock (sync) return new CommandResult(process.ExitCode, output.ToString());
        }
        catch (Exception ex)
        {
            return new CommandResult(-1, ex.Message);
        }
        finally { process.Dispose(); }
    }

    private static string QuoteArgument(string value)
    {
        StringBuilder quoted = new StringBuilder("\"");
        int slashes = 0;
        foreach (char character in value)
        {
            if (character == '\\') { slashes++; continue; }
            if (character == '"')
            {
                quoted.Append('\\', slashes * 2 + 1).Append('"');
                slashes = 0;
                continue;
            }
            quoted.Append('\\', slashes).Append(character);
            slashes = 0;
        }
        quoted.Append('\\', slashes * 2).Append('"');
        return quoted.ToString();
    }

    private sealed class CommandResult
    {
        public int ExitCode;
        public string Output;
        public CommandResult(int exitCode, string output) { ExitCode = exitCode; Output = output; }
    }
}
