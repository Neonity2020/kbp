import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Check,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FolderKanban,
  Home,
  Menu,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/page";
import { ProjectDialog } from "@/features/projects/project-dialog";
import { Projects, ProjectPage } from "@/features/projects/pages";
import { Dashboard } from "@/features/dashboard/page";
import { MyTasks } from "@/features/tasks/my-tasks";
import { SettingsPage } from "@/features/settings/page";
import { TaskSheet } from "@/features/tasks/components/task-sheet";
import { Person } from "@/features/tasks/components/task-card";
import { useWorkspace } from "@/features/tasks/api";
import { useDocuments } from "@/features/docs/api";
import { documentText } from "@/features/docs/lib/content";
import { usePreferences } from "@/stores/preferences";
import { repository } from "@/repositories/local-repository";
const DocumentsPage = lazy(() => import("@/features/docs/page"));
const DocumentEditorPage = lazy(() => import("@/features/docs/editor-page"));
const client = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity, retry: 1 } },
});
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="error-page">
        <h1>Something went wrong</h1>
        <p>Your workspace is saved locally. Reload to try again.</p>
        <Button onClick={() => window.location.reload()}>
          Reload workspace
        </Button>
      </main>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
        <Toaster richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
function Loading() {
  return (
    <div className="loading">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
function Shell() {
  const { data, isPending, error } = useWorkspace();
  const { data: documents } = useDocuments();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, collapsed, setTheme, toggleSidebar } = usePreferences();
  const [mobile, setMobile] = useState(false);
  const [command, setCommand] = useState(false);
  const [projectDialog, setProjectDialog] = useState(false);
  useLayoutEffect(() => {
    if (location.pathname.startsWith("/docs/"))
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.classList.toggle(
        "dark",
        theme === "dark" || (theme === "system" && media.matches),
      );
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommand((x) => !x);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const current = data?.projects.find((p) =>
    location.pathname.includes(`/projects/${p.id}`),
  );
  const page =
    location.pathname === "/home"
      ? "Home"
      : location.pathname === "/my-tasks"
        ? "My tasks"
        : location.pathname.startsWith("/docs")
          ? "Docs"
          : location.pathname === "/settings"
            ? "Settings"
            : "Projects";
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <Link to="/home" className="workspace">
          <span className="brand-mark">
            f<span>•</span>
          </span>
          <span className="nav-label">
            Forma Studio
            <ChevronDown />
          </span>
        </Link>
        <button className="search-launch" onClick={() => setCommand(true)}>
          <Search />
          <span className="nav-label">
            Search anything <kbd>⌘ K</kbd>
          </span>
        </button>
        <div className="nav-caption nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <NavLink to="/home" onClick={() => setMobile(false)}>
            <Home />
            <span className="nav-label">Home</span>
          </NavLink>
          <NavLink to="/my-tasks" onClick={() => setMobile(false)}>
            <Check />
            <span className="nav-label">My tasks</span>
            <span className="nav-count nav-label">
              {
                data?.tasks.filter(
                  (t) =>
                    t.assigneeId === "andi" &&
                    t.status !== "done" &&
                    !t.archived,
                ).length
              }
            </span>
          </NavLink>
          <NavLink to="/projects" end onClick={() => setMobile(false)}>
            <FolderKanban />
            <span className="nav-label">Projects</span>
          </NavLink>
          <NavLink to="/docs" onClick={() => setMobile(false)}>
            <BookOpen />
            <span className="nav-label">Docs</span>
          </NavLink>
        </nav>
        <div className="nav-caption projects-caption">
          <span className="nav-label">YOUR PROJECTS</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Create project"
            onClick={() => setProjectDialog(true)}
          >
            <Plus />
          </Button>
        </div>
        <nav aria-label="Projects">
          {data?.projects
            .filter((p) => !p.archived)
            .map((p) => (
              <NavLink
                key={p.id}
                to={`/projects/${p.id}/board`}
                onClick={() => setMobile(false)}
                className={current?.id === p.id ? "active" : ""}
              >
                <span className="project-dot" style={{ background: p.color }} />
                <span className="nav-label">{p.name}</span>
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-tip nav-label">
            <Sparkles />
            <strong>A little space. Big ideas.</strong>
            <p>Bring your team’s best work together.</p>
          </div>
          <nav>
            <NavLink to="/settings" onClick={() => setMobile(false)}>
              <Settings />
              <span className="nav-label">Settings</span>
            </NavLink>
          </nav>
          <div className="profile">
            <Person id="andi" />
            <div className="nav-label">
              <strong>Alex Morgan</strong>
              <span>Personal workspace</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Collapse sidebar"
              onClick={toggleSidebar}
            >
              <PanelLeftClose />
            </Button>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main-shell">
        <header className="app-header">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Open navigation"
            onClick={() => {
              if (window.innerWidth < 800) setMobile(true);
              else toggleSidebar();
            }}
          >
            <Menu />
          </Button>
          <span>Workspace</span>
          <ChevronRight />
          <Link to={current ? "/projects" : location.pathname}>{page}</Link>
          {current && (
            <>
              <ChevronRight />
              <span className="breadcrumb-current">{current.name}</span>
            </>
          )}
          <div className="header-actions">
            <span className="local-indicator">
              <span />
              Local workspace
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Search workspace"
              onClick={() => setCommand(true)}
            >
              <Search />
            </Button>
            <Person id="andi" />
          </div>
        </header>
        {repository.warning && (
          <Alert className="storage-alert">
            <AlertTitle>Storage notice</AlertTitle>
            <AlertDescription>{repository.warning}</AlertDescription>
          </Alert>
        )}
        <main>
          {isPending ? (
            <Loading />
          ) : error ? (
            <EmptyState
              title="Could not load workspace"
              description={error.message}
            />
          ) : (
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route
                  path="/projects/:projectId"
                  element={<ProjectRedirect />}
                />
                <Route
                  path="/projects/:projectId/:view"
                  element={<ProjectPage />}
                />
                <Route path="/docs" element={<DocumentsPage />} />
                <Route
                  path="/docs/:documentId"
                  element={<DocumentEditorPage />}
                />
                <Route path="/my-tasks" element={<MyTasks />} />
                <Route
                  path="/settings"
                  element={<SettingsPage setTheme={setTheme} theme={theme} />}
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          )}
        </main>
        <footer className="app-footer">
          <span>Made for a more focused day.</span>
          <span>
            <span className="tiny-dot" />{" "}
            {repository.warning
              ? "Session storage active"
              : "All changes saved locally"}
          </span>
        </footer>
      </div>
      <TaskSheet />
      <ProjectDialog
        key={String(projectDialog)}
        open={projectDialog}
        onClose={() => setProjectDialog(false)}
      />
      <Dialog open={command} onOpenChange={setCommand}>
        <DialogContent className="command-modal">
          <DialogHeader className="sr-only">
            <DialogTitle>Search workspace</DialogTitle>
            <DialogDescription>
              Find a task or navigate to a page.
            </DialogDescription>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Search tasks, projects, or commands…" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Navigate">
                {[
                  ["Home", "/home"],
                  ["Projects", "/projects"],
                  ["Docs", "/docs"],
                  ["My tasks", "/my-tasks"],
                  ["Settings", "/settings"],
                ].map(([name, path]) => (
                  <CommandItem
                    key={path}
                    onSelect={() => {
                      navigate(path);
                      setCommand(false);
                    }}
                  >
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Projects">
                {data?.projects.map((p) => (
                  <CommandItem
                    key={p.id}
                    onSelect={() => {
                      navigate(`/projects/${p.id}/board`);
                      setCommand(false);
                    }}
                  >
                    {p.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Documents">
                {documents
                  ?.filter((d) => !d.trashedAt)
                  .map((d) => (
                    <CommandItem
                      key={d.id}
                      value={`doc ${d.title} ${documentText(d.content)}`}
                      onSelect={() => {
                        navigate(`/docs/${d.id}`);
                        setCommand(false);
                      }}
                    >
                      <BookOpen />
                      {d.title}
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandGroup heading="Tasks">
                {data?.tasks
                  .filter((t) => !t.archived)
                  .map((t) => (
                    <CommandItem
                      key={t.id}
                      value={`${t.key} ${t.title}`}
                      onSelect={() => {
                        navigate(`/projects/${t.projectId}/board?task=${t.id}`);
                        setCommand(false);
                      }}
                    >
                      <span className="task-key">{t.key}</span>
                      {t.title}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function ProjectRedirect() {
  const { projectId } = useParams();
  return <Navigate to={`/projects/${projectId}/board`} replace />;
}
function NotFound() {
  return (
    <div className="page not-found">
      <CircleHelp />
      <h1>We couldn’t find that page</h1>
      <p>The project or page may have moved. Your workspace is still here.</p>
      <Button asChild>
        <Link to="/home">Back to Home</Link>
      </Button>
    </div>
  );
}
