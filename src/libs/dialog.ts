/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-03-23 21:37:33
 * @FilePath     : /src/libs/dialog.ts
 * @LastEditTime : 2024-12-29 20:30:34
 * @Description  : 对话框相关工具
 */
import { Dialog } from "siyuan";
import { JSXElement } from "solid-js";
import { render } from "solid-js/web";

import { simpleDialog } from "@frostime/siyuan-plugin-kits";

export const solidDialog = (args: {
    title: string, loader: () => JSXElement,
    width?: string, height?: string,
    callback?: () => void;
}) => {
    let container = document.createElement('div')
    container.style.display = 'contents';
    let disposer = render(args.loader, container);
    const {dialog, close} = simpleDialog({...args, ele: container, callback: () => {
        disposer();
        if (args.callback) args.callback();;
    }});
    return {
        dialog,
        close,
        container
    }
}

interface IConfirmDialogArgs {
    title: string;
    content: string | HTMLElement;
    confirm?: (ele?: HTMLElement) => void;
    cancel?: (ele?: HTMLElement) => void;
    width?: string;
    height?: string;
}

export const confirmDialog = (args: IConfirmDialogArgs) => {
    const { title, content, confirm, cancel, width, height } = args;

    const dialog = new Dialog({
        title,
        content: `<div class="b3-dialog__content">
    <div class="ft__breakword">
    </div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text" id="confirmDialogConfirmBtn">${window.siyuan.languages.confirm}</button>
</div>`,
        width: width,
        height: height
    });

    const target: HTMLElement = dialog.element.querySelector(".b3-dialog__content>div.ft__breakword");
    if (typeof content === "string") {
        target.innerHTML = content;
    } else {
        target.appendChild(content);
    }

    const btnsElement = dialog.element.querySelectorAll(".b3-button");
    btnsElement[0].addEventListener("click", () => {
        if (cancel) {
            cancel(target);
        }
        dialog.destroy();
    });
    btnsElement[1].addEventListener("click", () => {
        if (confirm) {
            confirm(target);
        }
        dialog.destroy();
    });
    return dialog;
};
