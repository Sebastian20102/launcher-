import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { motion, type Variants } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type UpgradeBannerProps = {
  title?: string;
  description?: string;
  buttonText?: string;
  onClick?: () => void;
  onClose?: () => void;
};

const iconVariants: Variants = {
  hidden: {
    x: 0,
    y: 0,
    opacity: 0,
    rotate: 0,
    scale: 0.35,
  },
  visible: (custom: { x: number; y: number }) => ({
    x: custom.x,
    y: custom.y,
    opacity: 1,
    rotate: 260,
    scale: 1,
    transition: {
      x: { duration: 0.28, ease: "easeOut" },
      y: { duration: 0.28, ease: "easeOut" },
      opacity: { duration: 0.18 },
      scale: { duration: 0.2 },
      rotate: {
        duration: 0.7,
        type: "spring",
        stiffness: 120,
        damping: 10,
      },
    },
  }),
};

function SettingsFilled({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M10.33 2.25h3.34l.65 2.6c.46.16.9.34 1.31.56l2.29-1.38 2.36 2.36-1.38 2.29c.22.42.4.86.56 1.31l2.6.65v3.34l-2.6.65c-.16.46-.34.9-.56 1.31l1.38 2.29-2.36 2.36-2.29-1.38c-.42.22-.86.4-1.31.56l-.65 2.6h-3.34l-.65-2.6c-.46-.16-.9-.34-1.31-.56l-2.29 1.38-2.36-2.36 1.38-2.29c-.22-.42-.4-.86-.56-1.31l-2.6-.65v-3.34l2.6-.65c.16-.46.34-.9.56-1.31L3.72 6.39l2.36-2.36 2.29 1.38c.42-.22.86-.4 1.31-.56l.65-2.6Zm1.67 6.5a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z" />
    </svg>
  );
}

export function UpgradeBanner({
  title = "Nexus Core update available",
  description = "Nueva identidad, animaciones limpias y componentes listos para probar antes de aplicarlos al launcher.",
  buttonText = "Upgrade to Pro",
  onClick,
  onClose,
}: UpgradeBannerProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-md border border-primary/20 bg-[#11110f] p-5">
      <motion.div
        aria-hidden
        className="absolute inset-y-0 left-0 w-1/3 bg-primary/10 blur-2xl"
        animate={{ x: ["-80%", "260%"] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative flex flex-col gap-4 pr-9 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="grid size-11 place-items-center rounded-md border border-primary/25 bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold">{title}</div>
              <Badge variant="secondary">21st style</Badge>
            </div>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <button
          className="focus-visible:shadow-focus-ring relative my-[-1px] cursor-pointer overflow-visible rounded-xs border-none bg-transparent px-0 py-1 font-sans text-[13px] font-medium text-[#002359] underline decoration-[#CAE7FF] underline-offset-[5px] outline-none hover:text-[#005FF2] hover:decoration-[#94CCFF] focus-visible:!shadow-[#008FFF] dark:text-[#EAF5FF] dark:decoration-[#003674] dark:hover:text-[#44A7FF] dark:hover:decoration-[#00408A]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onClick}
        >
          {buttonText === "Upgrade to Pro" ? (
            <>
              <span className="relative inline-block">
                U
                <motion.span
                  initial="hidden"
                  animate={isHovered ? "visible" : "hidden"}
                  variants={iconVariants}
                  custom={{ x: -9, y: -12 }}
                  className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-[19px] text-[#005FF2] dark:text-[#006EFE]"
                >
                  <SettingsFilled className="h-[19px] w-[19px]" />
                </motion.span>
              </span>
              pgrade to Pr
              <span className="relative inline-block">
                o
                <motion.span
                  initial="hidden"
                  animate={isHovered ? "visible" : "hidden"}
                  variants={iconVariants}
                  custom={{ x: 6, y: 13 }}
                  className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-[19px] text-[#005FF2] dark:text-[#006EFE]"
                >
                  <SettingsFilled className="h-[19px] w-[19px]" />
                </motion.span>
              </span>
            </>
          ) : (
            <span className="relative z-10">{buttonText}</span>
          )}
        </button>
      </div>

      {onClose && (
        <Button
          aria-label="Cerrar banner"
          className="absolute right-3 top-3 size-7 p-0"
          size="icon"
          variant="secondary"
          onClick={onClose}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
