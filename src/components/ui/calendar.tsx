"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4 relative",
        month_caption: "flex justify-center pt-1 items-center w-full h-8",
        caption_label: "text-sm font-medium text-white",
        nav: "absolute top-0 left-0 right-0 flex items-center justify-between pointer-events-none",
        button_previous: "h-8 w-8 bg-transparent p-0 text-zinc-400 hover:text-white flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors pointer-events-auto",
        button_next: "h-8 w-8 bg-transparent p-0 text-zinc-400 hover:text-white flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors pointer-events-auto",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-zinc-600 rounded-md w-8 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          "h-8 w-8 p-0 font-normal rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors",
          "aria-selected:bg-blue-600 aria-selected:text-white aria-selected:hover:bg-blue-700",
        ),
        range_end: "day-range-end",
        selected: "[&>button]:bg-blue-600 [&>button]:text-white [&>button]:hover:bg-blue-700",
        today: "[&>button]:bg-zinc-800 [&>button]:text-white",
        outside: "[&>button]:text-zinc-700 [&>button]:aria-selected:bg-blue-600/30",
        disabled: "[&>button]:text-zinc-700 [&>button]:pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left"
            ? <ChevronLeft className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
