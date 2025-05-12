/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-12 19:48:53
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2025-05-07 11:59:08
 * @Description  : 
 */
import {
    Plugin,
} from "siyuan";


import { solidDialog } from "./libs/dialog";

import { configRef, getModel, rmModel, saveConfig, subViews, type BookmarkDataModel } from "./model";
import { configs } from "./model";

import Setting from './components/setting';

import { updateStyleDom, removeStyleDom } from "@/utils/style";
import { Svg } from "@/utils/const";
import { setI18n } from "@/utils/i18n";

import "@/index.scss";
import { isMobile } from "./utils";

import { loadSdk, unloadSdk } from "./sdk";

import { registerPlugin } from "@frostime/siyuan-plugin-kits";
import { enableAutoRefresh } from "./model/auto-refresh";

import { destroyAllBookmark, dockViewIconElement, dockViewTypeName, initBookmark } from "./dock-views";

let model: BookmarkDataModel;


const useSiyuanBookmarkKeymap = () => {
    const bookmarkKeymap = window.siyuan.config.keymap.general.bookmark;
    const initial = bookmarkKeymap.custom || bookmarkKeymap.default;

    const pluginKeymap = () => window.siyuan.config.keymap.plugin['sy-bookmark-plus']?.['F-Misc::Bookmark'];

    return {
        initial,
        replaceDefault: () => {
            bookmarkKeymap.custom = '';
            updateStyleDom('hide-bookmark', `
                .dock span[data-type="bookmark"] {
                    display: none;
                }
            `);
            const min = document.querySelector('div.file-tree.sy__bookmark span[data-type="min"]') as HTMLElement;
            min?.click();
            const keymap = pluginKeymap();
            if (keymap) {
                keymap.custom = initial;
            }
        },
        // 恢复
        restoreDefault: () => {
            bookmarkKeymap.custom = initial;
            removeStyleDom('hide-bookmark');
            const keymap = pluginKeymap();
            if (keymap) {
                keymap.custom = '';
            }
        }
    }
}

export const bookmarkKeymap = useSiyuanBookmarkKeymap();


export default class PluginBookmarkPlus extends Plugin {

    declare data: {
        bookmarks: {
            [key: TBookmarkGroupId]: IBookmarkGroup;
        };
    }

    //@ts-ignore
    declare readonly i18n: I18n;

    async onload() {
        //@ts-ignore
        registerPlugin(this);
        setI18n(this.i18n as I18n);

        let svgs = Object.values(Svg);
        this.addIcons(svgs.join(''));

        model = getModel(this);

        await model.load();

        if (configs.replaceDefault) {
            this.replaceDefaultBookmark();
        }

        this.addDock({
            type: dockViewTypeName('DEFAULT'),
            config: {
                position: 'RightBottom',
                size: {
                    width: 200,
                    height: 200,
                },
                icon: 'iconBookmark',
                title: 'Bookmark+'
            },
            data: {
                plugin: this,
                initBookmark: initBookmark,
            },
            init() {
                //@ts-ignore
                this.data.initBookmark(this.element, 'DEFAULT');
            }
        });

        for (let [vid, view] of Object.entries(subViews())) {
            if (view.hidden === true) continue;
            let icon = 'iconEmoji';
            if (view.icon?.type === 'symbol') {
                icon = view.icon.value;
            }
            this.addDock({
                type: dockViewTypeName(vid),
                config: {
                    position: view.dockPosition ?? 'RightBottom',
                    size: {
                        width: 200,
                        height: 200,
                    },
                    icon: icon,
                    title: view.name || 'Bookmark+'
                },
                data: {
                    plugin: this,
                    initBookmark: initBookmark,
                },
                init() {
                    //@ts-ignore
                    this.data.initBookmark(this.element, vid);
                }
            });
        }

        // useSdk(this);
        loadSdk();
        if (configRef().autoRefreshTemplatingRuleOnSwitchProtyle) {
            enableAutoRefresh();
        }
    }

    private replaceDefaultBookmark() {
        bookmarkKeymap.replaceDefault();

        this.addCommand({
            langKey: 'F-Misc::Bookmark',
            langText: 'F-misc Bookmark',
            hotkey: bookmarkKeymap.initial,
            callback: () => {
                const ele = dockViewIconElement('DEFAULT');
                ele?.click();
            }
        });
    }

    onunload(): void {
        unloadSdk();
        rmModel();
        destroyAllBookmark();
        bookmarkKeymap.restoreDefault();
    }

    openSetting(): void {
        let size = {
            width: '1200px',
            height: '720px',
            maxWidth: '90%',
            maxHeight: '90%',
        };
        if (isMobile()) {
            //@ts-ignore
            size = {
                width: '100%',
                height: '90%'
            }
        }
        solidDialog({
            title: window.siyuan.languages.config,
            loader: () => Setting(),
            callback: async () => {
                await saveConfig();
                await model.save();
            },
            ...size
        });
    }

}
