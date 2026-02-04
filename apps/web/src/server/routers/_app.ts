import { router } from "../trpc";
import { derRouter } from "./der";
import { repositoryRouter } from "./repository";
import { settingsRouter } from "./settings";

export const appRouter = router({
  der: derRouter,
  repository: repositoryRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
