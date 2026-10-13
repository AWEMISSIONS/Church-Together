import { headers } from "next/headers";
import { getAccess } from "../db/access";
import Login from "./login";
import Workspace from "./workspace";
export const dynamic = "force-dynamic";
export default async function Home() {
  const requestHeaders = await headers();
  const access = await getAccess(new Request("https://app.local/", { headers: requestHeaders }));
  return access ? <Workspace /> : <Login />;
}
