import { createContext, useContext } from "react";
import { mobxStore, GymStore } from "./GymStore";

const MobxStoreContext = createContext<GymStore>(mobxStore);

export const MobxStoreProvider = MobxStoreContext.Provider;

export function useMobxStore() {
  return useContext(MobxStoreContext);
}
