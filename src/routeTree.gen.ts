/* eslint-disable */
// @ts-nocheck
import { Route as rootRouteImport } from "./routes/__root";
import { Route as IndexRouteImport } from "./routes/index";
import { Route as CennikRouteImport } from "./routes/cennik";
import { Route as KontoRouteImport } from "./routes/konto";
import { Route as NaTelefonRouteImport } from "./routes/na-telefon";
import { Route as NoweRouteImport } from "./routes/nowe";
import { Route as OpinieRouteImport } from "./routes/opinie";
import { Route as PrywatnoscRouteImport } from "./routes/prywatnosc";
import { Route as RaportRouteImport } from "./routes/raport";
import { Route as RegulaminRouteImport } from "./routes/regulamin";

const IndexRoute = IndexRouteImport.update({ id: "/", path: "/", getParentRoute: () => rootRouteImport } as any);
const CennikRoute = CennikRouteImport.update({ id: "/cennik", path: "/cennik", getParentRoute: () => rootRouteImport } as any);
const KontoRoute = KontoRouteImport.update({ id: "/konto", path: "/konto", getParentRoute: () => rootRouteImport } as any);
const NaTelefonRoute = NaTelefonRouteImport.update({ id: "/na-telefon", path: "/na-telefon", getParentRoute: () => rootRouteImport } as any);
const NoweRoute = NoweRouteImport.update({ id: "/nowe", path: "/nowe", getParentRoute: () => rootRouteImport } as any);
const OpinieRoute = OpinieRouteImport.update({ id: "/opinie", path: "/opinie", getParentRoute: () => rootRouteImport } as any);
const PrywatnoscRoute = PrywatnoscRouteImport.update({ id: "/prywatnosc", path: "/prywatnosc", getParentRoute: () => rootRouteImport } as any);
const RaportRoute = RaportRouteImport.update({ id: "/raport", path: "/raport", getParentRoute: () => rootRouteImport } as any);
const RegulaminRoute = RegulaminRouteImport.update({ id: "/regulamin", path: "/regulamin", getParentRoute: () => rootRouteImport } as any);

export const routeTree = rootRouteImport._addFileChildren({
  IndexRoute,
  CennikRoute,
  KontoRoute,
  NaTelefonRoute,
  NoweRoute,
  OpinieRoute,
  PrywatnoscRoute,
  RaportRoute,
  RegulaminRoute,
});
