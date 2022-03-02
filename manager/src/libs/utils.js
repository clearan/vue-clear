// 这里的方法是递归。
// 利用对象的引用也可实现，参考https://juejin.cn/post/6983904373508145189
function formateRouterTree(data) {
    const parent = data.filter(p => p.pid === 0)
    const children = data.filter(c => c.pid !== 0)
    function dataToTree(parent, children) {
        parent.forEach(p => {
            children.forEach((c, index) => {
                if (p.id === c.pid) {
                    const _deepC = JSON.parse(JSON.stringify(children));
                    _deepC.splice(index, 1);
                    dataToTree([c], _deepC); // 当前为父亲，剩下的为儿子再次遍历
                    if (!p.children) {
                        p.children = [c]
                    } else {
                        p.children.push(c);
                    }
                }
            })
        })
    }
    dataToTree(parent, children);
    return parent;
}

function generateRouter(userRouters) {
    // userRouters是一个树形结构，该函数返回vue路由需要的格式
    return userRouters.map(r => {
        let routes = {
            path: r.path,
            name: r.name,
            component: () => import(`@/views/${r.name}`)
        }
        if (r.children) {
            routes.children = generateRouter(r.children)
        }
        return routes
    })
}

export {
    formateRouterTree,
    generateRouter
}
