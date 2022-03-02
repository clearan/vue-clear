import {getUserRoutes} from "../services";
import {formateRouterTree, generateRouter} from "../libs/utils";

export default {
    async setUserRouter({commit, state}) {
        const userRouters = await getUserRoutes(state.uid)
        const data = formateRouterTree(userRouters);
        console.log(data);
        console.log(generateRouter(data));
        commit('setUserRouter', data);
        commit('setAuth', true);
    }
}
