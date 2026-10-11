"use client";

import { ArticleProvider } from "@/src/context/ArticleContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <ArticleProvider>{children}</ArticleProvider>;
}
