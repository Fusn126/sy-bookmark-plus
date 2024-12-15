// import type PluginBookmarkPlus from ".";
import { groups, itemInfo } from "./model/stores";
// import { getModel } from "./model";

const Name = 'BookmarkPlusSDK';

export const loadSdk = () => {
    const sdk = {
        listGroups: () => {
            return groups.map(group => ({
                id: group.id,
                name: group.name,
                expand: group.expand,
                hidden: group.hidden,
                type: group.type,
            }));
        },
        listItems: (groupId: string) => {
            if (!groupId || typeof groupId !== 'string') {
                return [];
            }
            let items = groups.find(group => group.id === groupId)?.items.slice() || [];
            items = items.filter((it) => itemInfo[it.id]?.err !== 'BoxClosed');
            items = items.filter((it) => itemInfo[it.id]?.err !== 'BlockDeleted');
            return items.map(it => it.id);
        }
    };
    // Object.assign(plugin, sdk);
    globalThis[Name] = new Proxy(sdk, {
        get: (target, prop) => {
            return target[prop as keyof typeof target];
        }
    });
}

export const unloadSdk = () => {
    if (globalThis[Name]) {
        delete globalThis[Name];
    }
}
