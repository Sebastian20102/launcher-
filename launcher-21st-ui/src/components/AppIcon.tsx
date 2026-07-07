import { useEffect, useState } from "react";

import { getIcon, type LibraryItem } from "@/lib/library";
import { cn } from "@/lib/utils";

type AppIconProps = {
  item: LibraryItem;
  className?: string;
  iconClassName?: string;
};

export function AppIcon({ item, className, iconClassName }: AppIconProps) {
  const Icon = getIcon(item.icon);
  const [imageFailed, setImageFailed] = useState(false);
  const canUseImage = Boolean(item.iconUrl && !imageFailed);

  useEffect(() => {
    setImageFailed(false);
  }, [item.iconUrl]);

  return (
    <div
      className={cn(
        "grid place-items-center overflow-hidden rounded-xl border border-white/12 bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_14px_34px_rgba(0,0,0,0.22)] backdrop-blur-xl",
        className,
      )}
    >
      {canUseImage ? (
        <img
          alt=""
          src={item.iconUrl}
          className={cn("size-3/4 object-contain drop-shadow-sm", iconClassName)}
          draggable={false}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Icon className={cn("size-1/2", iconClassName)} />
      )}
    </div>
  );
}
