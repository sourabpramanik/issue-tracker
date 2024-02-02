import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader } from "lucide-react";
import IssueModal from "@/components/issue-modal";
import Row from "./row";
import { useGetTasks } from "@/lib/hooks";

export interface TaskSchema {
  title: string;
  description: string;
  status: "todo" | "inprogress" | "done" | "backlog";
  label: "bug" | "feature" | "documentation";
  author: string;
}

export default function UsersTable() {
  const { isLoading, data } = useGetTasks();
  return (
    <>
      <div className="w-full flex justify-end">
        <IssueModal />
      </div>
      {isLoading && <Loader className="w-4 h-4 animate-spin" />}
      {!isLoading && (
        <div className="border rounded-xl w-full overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary rounded-t-xl">
                <TableHead>Author</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length ? (
                data.map((task: TaskSchema, id: string) => {
                  return <Row key={id} task={task} />;
                })
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
