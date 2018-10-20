import * as ExportType from "./lib";
import * as f from "bobflux";

export interface IApplicationState extends f.IState {
  externalTypeReexported: ExportType.SomeOtherType.IInnerState;
}
