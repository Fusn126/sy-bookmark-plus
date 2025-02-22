/*
 * Copyright (c) 2025 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2025-02-22 00:35:14
 * @FilePath     : /src/dock-views.ts
 * @LastEditTime : 2025-02-22 16:18:40
 * @Description  : 
 */
import { render } from "solid-js/web";

import { isMobile, thisPlugin } from "@frostime/siyuan-plugin-kits";

import Bookmark from "./components/bookmark";
import { getModel } from "./model";

export const disposers = {
    _ele: {} as Record<TBookmarkSubViewId, HTMLElement>,
    _disposer: {} as Record<TBookmarkSubViewId, (() => void)>,
    add: (vid: TBookmarkSubViewId, fn: () => void, element: HTMLElement) => {
        if (!disposers._disposer[vid]) {
            disposers._disposer[vid] = fn;
        } else {
            console.warn(`SubView ${vid} already exists`);
        }
        if (element) {
            disposers._ele[vid] = element;
        }
    },
    disposeAll: () => {
        for (let [vid, fn] of Object.entries(disposers._disposer)) {
            disposers.dispose(vid as TBookmarkSubViewId);
        }
    },
    dispose: (vid: TBookmarkSubViewId) => {
        if (disposers._disposer[vid]) {
            disposers._disposer[vid]();
            delete disposers._disposer[vid];
        }
        if (disposers._ele[vid]) {
            const ele = disposers._ele[vid];
            const container = ele?.closest('[data-type="wnd"]')?.closest('.fn__flex-1.fn__flex:not([data-type="wnd"])')
            container?.classList.toggle('fn__none', true);
            // ele?.remove();
            delete disposers._ele[vid];
            const iconBtn = dockViewIconElement(vid);
            if (!iconBtn) return;
            if (iconBtn.classList.contains('dock__item--active')) {
                iconBtn.click();
            }
            iconBtn?.remove();
        }
    }
};

export const dockViewTypeName = (vid: TBookmarkSubViewId | 'DEFAULT') => {
    return '::sub-view::' + vid;
}


export const dockViewIconElement = (vid: TBookmarkSubViewId | 'DEFAULT') => {
    const plugin = thisPlugin();
    return document.querySelector(`span[data-type="${plugin.name}${dockViewTypeName(vid)}"]`) as HTMLElement;
}

const lazyUpdateModel = {
    _hasUpdate: false,
    update: async () => {
        if (lazyUpdateModel._hasUpdate === false) {
            lazyUpdateModel._hasUpdate = true;
            const model = getModel();
            await model.updateAll();
        }
    }
}

export const initBookmark = async (ele: HTMLElement, sourceView: string) => {
    ele.classList.add('fn__flex-column');

    if (isMobile()) {
        //Refer to https://github.com/frostime/sy-bookmark-plus/issues/13#issuecomment-2283031563
        let empty = ele.querySelector('.b3-list--empty') as HTMLElement;
        if (empty) empty.style.display = 'none';
    }
    const dispose = render(() => Bookmark({
        //@ts-ignore
        plugin: thisPlugin(),
        sourceView: sourceView ?? 'DEFAULT'
    }), ele);
    // disposers.add(dispose);
    disposers.add(sourceView ?? 'DEFAULT', dispose, ele);
    lazyUpdateModel.update();
};

export const destroyBookmark = (viewId: TBookmarkGroupId) => {
    // rmModel();
    disposers.dispose(viewId);
};

export const destroyAllBookmark = () => {
    const viewIds = Object.keys(disposers._disposer);
    for (let vid of viewIds) {
        destroyBookmark(vid as TBookmarkGroupId);
    }
}

