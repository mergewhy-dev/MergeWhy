import { router } from "../trpc";
import { derRouter } from "./der";
import { repositoryRouter } from "./repository";
import { settingsRouter } from "./settings";
import { complianceRouter } from "./compliance";

export const appRouter = router({
  der: derRouter,
  repository: repositoryRouter,
  settings: settingsRouter,
  compliance: complianceRouter,
});

export type AppRouter = typeof appRouter;
