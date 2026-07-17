import Dashboard from "./dashboard";
import { createDashboardBundle } from "../lib/model.ts";

export default function Home() {
  return <Dashboard initialBundle={createDashboardBundle()} />;
}
