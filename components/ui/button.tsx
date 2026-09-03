import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants=cva("inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",{variants:{variant:{default:"bg-blue-600 text-white hover:bg-blue-700",outline:"border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",ghost:"text-slate-700 hover:bg-slate-100"},size:{default:"h-11 px-5",sm:"h-9 px-3 text-xs",lg:"h-12 px-6"}},defaultVariants:{variant:"default",size:"default"}});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof buttonVariants>{asChild?:boolean}
export function Button({className,variant,size,asChild=false,...props}:ButtonProps){const Comp=asChild?Slot:"button";return <Comp className={cn(buttonVariants({variant,size,className}))}{...props}/>}
