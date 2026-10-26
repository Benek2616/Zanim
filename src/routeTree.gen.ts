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
import { Route as ZarzadzanieRouteImport } from "./routes/zarzadzanie";
import { Route as ApiAdminStatsRouteImport } from "./routes/api/admin-stats";
import { Route as ApiTrackSignupRouteImport } from "./routes/api/track-signup";
import { Route as ApiTrackVisitRouteImport } from "./routes/api/track-visit";

const IndexRoute = IndexRouteImport.update({ id: "/", path: "/", getParentRoute: () => rootRouteImport } as any);
const CennikRoute = CennikRouteImport.update({ id: "/cennik", path: "/cennik", getParentRoute: () => rootRouteImport } as any);
const KontoRoute = KontoRouteImport.update({ id: "/konto", path: "/konto", getParentRoute: () => rootRouteImport } as any);
const NaTelefonRoute = NaTelefonRouteImport.update({ id: "/na-telefon", path: "/na-telefon", getParentRoute: () => rootRouteImport } as any);
const NoweRoute = NoweRouteImport.update({ id: "/nowe", path: "/nowe", getParentRoute: () => rootRouteImport } as any);
const OpinieRoute = OpinieRouteImport.update({ id: "/opinie", path: "/opinie", getParentRoute: () => rootRouteImport } as any);
const PrywatnoscRoute = PrywatnoscRouteImport.update({ id: "/prywatnosc", path: "/prywatnosc", getParentRoute: () => rootRouteImport } as any);
const RaportRoute = RaportRouteImport.update({ id: "/raport", path: "/raport", getParentRoute: () => rootRouteImport } as any);
const RegulaminRoute = RegulaminRouteImport.update({ id: "/regulamin", path: "/regulamin", getParentRoute: () => rootRouteImport } as any);
const ZarzadzanieRoute = ZarzadzanieRouteImport.update({ id: "/zarzadzanie", path: "/zarzadzanie", getParentRoute: () => rootRouteImport } as any);
const ApiAdminStatsRoute = ApiAdminStatsRouteImport.update({ id: "/api/admin-stats", path: "/api/admin-stats", getParentRoute: () => rootRouteImport } as any);
const ApiTrackSignupRoute = ApiTrackSignupRouteImport.update({ id: "/api/track-signup", path: "/api/track-signup", getParentRoute: () => rootRouteImport } as any);
const ApiTrackVisitRoute = ApiTrackVisitRouteImport.update({ id: "/api/track-visit", path: "/api/track-visit", getParentRoute: () => rootRouteImport } as any);

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
  ZarzadzanieRoute,
  ApiAdminStatsRoute,
  ApiTrackSignupRoute,
  ApiTrackVisitRoute,
});
