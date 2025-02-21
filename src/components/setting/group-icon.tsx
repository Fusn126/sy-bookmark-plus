import Icon from "../icon";

export const GroupIcon = (props: {
    group: IBookmarkGroup;
}) => {
    const icon = props.group.icon
    if (!icon || icon.type === '') {
        return <Icon symbol={(!props.group.type || props.group.type === 'normal') ? 'iconFolder' : 'iconSearch'} />
    } else if (icon.type === 'symbol') {
        return <Icon symbol={icon.value} />
    } else if (icon.type === 'emoji') {
        return <Icon emojiCode={icon.value} />
    }
}