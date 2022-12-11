import React, { FC, useState } from "react";
import style from "./SidebarLayout.module.css";
import { ArrowPosition } from "../../types";
import { Arrow } from "../../shared/ui";

interface SidebarLayoutProps
  extends React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > {
  children: React.ReactNode;
  arrowPosition?: ArrowPosition;
  arrowClassName?: string;
}

export const SidebarLayout: FC<SidebarLayoutProps> = ({
  children,
  className,
  arrowPosition,
  arrowClassName,
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const onClickHandler = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside
      className={`${style.sidebar} ${className || ""} ${
        collapsed ? style.collapsed : ""
      }`}
    >
      {arrowPosition && (
        <Arrow
          position={arrowPosition}
          onClick={onClickHandler}
          className={`${arrowClassName} ${style.arrow}`}
        />
      )}
      <div className={style.content}>{children}</div>
    </aside>
  );
};
