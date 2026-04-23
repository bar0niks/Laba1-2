import { UserDto } from "@gym/shared-types";

export type StateManager = "mobx" | "redux";

export type SessionUser = UserDto;

export interface RemotePageProps {
  user: SessionUser;
  stateManager: StateManager;
  onUnauthorized?: () => void;
}
