/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-06-12 19:48:53
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2025-02-20 20:47:27
 * @Description  : 
 */
import {
    Plugin,
} from "siyuan";

import { render } from "solid-js/web";

import { solidDialog } from "./libs/dialog";

import { configRef, getModel, rmModel, saveConfig, type BookmarkDataModel } from "./model";
import { configs } from "./model";

import Bookmark from "./components/bookmark";
import Setting from './components/setting';

import { updateStyleDom, removeStyleDom } from "@/utils/style";
import { Svg } from "@/utils/const";
import { setI18n } from "@/utils/i18n";

import "@/index.scss";
import { isMobile } from "./utils";

import { loadSdk, unloadSdk } from "./sdk";

import { registerPlugin, thisPlugin } from "@frostime/siyuan-plugin-kits";
import { enableAutoRefresh } from "./model/auto-refresh";

let model: BookmarkDataModel;

const initBookmark = async (ele: HTMLElement, sourceView?: string) => {
    ele.classList.add('fn__flex-column');

    if (isMobile()) {
        //Refer to https://github.com/frostime/sy-bookmark-plus/issues/13#issuecomment-2283031563
        let empty = ele.querySelector('.b3-list--empty') as HTMLElement;
        if (empty) empty.style.display = 'none';
    }
    render(() => Bookmark({
        //@ts-ignore
        plugin: thisPlugin(),
        model: model,
        sourceView: sourceView ?? 'DEFAULT'
    }), ele);
    await model.updateAll();
};

const destroyBookmark = () => {
    rmModel();
    model = null;
    const ele = document.querySelector('span[data-type="sy-bookmark-plus::dock"]') as HTMLElement;
    ele?.remove();
};


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
            type: '::dock',
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
                this.data.initBookmark(this.element, 'DEFAULT');
            }
        });

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
                const ele = document.querySelector(`span[data-type="${this.name}::dock"]`) as HTMLElement;
                ele?.click();
            }
        });
    }

    onunload(): void {
        unloadSdk();
        destroyBookmark();
        bookmarkKeymap.restoreDefault();
    }

    openSetting(): void {
        let size = {
            width: '900px',
            height: '600px'
        }
        if (isMobile()) {
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
