import { Match, Switch } from "solid-js";
import Icon from "./icon";

export const GroupIcon = (props: {
    group: IBookmarkGroup;
}) => {
    return (
        <Switch fallback={<Icon symbol={(!props.group.type || props.group.type === 'normal') ? 'iconFolder' : 'iconSearch'} />}>
            <Match when={props.group.icon?.type === 'symbol'}>
                <Icon symbol={props.group.icon.value} />
            </Match>
            <Match when={props.group.icon?.type === 'emoji'}>
                <Icon emojiCode={props.group.icon.value} />
            </Match>
        </Switch>
    );
}