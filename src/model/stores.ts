/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-07-07 14:44:03
 * @FilePath     : /src/model/stores.ts
 * @LastEditTime : 2025-02-15 19:36:13
 * @Description  : 
 */
import { createStore } from "solid-js/store";

import { createMemo } from "solid-js";
import { wrapStoreRef } from "@frostime/solid-signal-ref";
import { debounce, thisPlugin } from "@frostime/siyuan-plugin-kits";

export const [itemInfo, setItemInfo] = createStore<{ [key: BlockId]: IBookmarkItemInfo }>({});

export const [groups, setGroups] = createStore<IBookmarkGroup[]>([]);
export const groupMap = createMemo<Map<TBookmarkGroupId, IBookmarkGroup & {index: number}>>(() => {
    return new Map(groups.map((group, index) => [group.id, {...group, index: index}]));
});

interface IConfig {
    hideClosed: boolean;
    hideDeleted: boolean;
    viewMode: 'bookmark' | 'card';
    replaceDefault: boolean;
    autoRefreshOnExpand: boolean;
    ariaLabel: boolean;
    zoomInWhenClick: boolean;
}

export const [configs, setConfigs] = createStore<IConfig>({
    hideClosed: true,
    hideDeleted: true,
    viewMode: 'bookmark',
    replaceDefault: true,
    autoRefreshOnExpand: false,
    ariaLabel: false,
    zoomInWhenClick: true
});
export const configRef = wrapStoreRef(configs, setConfigs);

const StorageFileConfigs = 'bookmark-configs.json';  //书签插件相关的配置
const _saveConfig = async () => {
    const data = configRef.unwrap();
    console.debug('save config', data);
    const plugin = thisPlugin();
    await plugin.saveData(StorageFileConfigs, data);
}
export const saveConfig = debounce(_saveConfig, 750);

export const loadConfig = async () => {
    const plugin = thisPlugin();
    let configs_ = await plugin.loadData(StorageFileConfigs) as IConfig;
    // setConfigs(configs_);
    if (configs_) {
        setConfigs({ ...configs, ...configs_ });
    }
}
