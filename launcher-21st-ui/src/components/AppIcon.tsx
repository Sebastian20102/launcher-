import { getIcon, type LibraryItem } from "@/lib/library";
import { cn } from "@/lib/utils";

type AppIconProps = {
  item: LibraryItem;
  className?: string;
  iconClassName?: string;
};

export function AppIcon({ item, className, iconClassName }: AppIconProps) {
  const Icon = getIcon(item.icon);

  return (
    <div className={cn("grid place-items-center overflow-hidden rounded-md", item.accent, className)}>
      {item.iconUrl ? (
        <img
          alt=""
          src={item.iconUrl}
          className={cn("size-3/4 object-contain drop-shadow-sm", iconClassName)}
          draggable={false}
        />
      ) : (
        <Icon className={cn("size-1/2", iconClassName)} />
      )}
    </div>
  );
}
