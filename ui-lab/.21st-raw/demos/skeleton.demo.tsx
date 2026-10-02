// Source: 21st.dev — "Skeleton" by @shadcn (demo id 1588, demo "With card")
// https://21st.dev/@shadcn/components/skeleton
// Install: https://21st.dev/r/shadcn/skeleton
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function Cards() {
  return (
    <Card  className="min-w-[300px]">
      <CardHeader>
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-72 w-full rounded" />
      </CardContent>
      <CardFooter className="gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </CardFooter>
    </Card>
  );
}