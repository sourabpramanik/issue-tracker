import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader } from "lucide-react";
import Row from "./row";
import { useGetIssues } from "@/lib/hooks";
import { IssueSchema } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { useIssueModalStore, useIssueStore } from "@/lib/store";

export default function UsersTable() {
  const { isLoading, data } = useGetIssues();
  const { setOpen } = useIssueModalStore();
  const { setEditIssueId } = useIssueStore();
  return (
    <>
      <div className="w-full flex justify-end">
        <Button
          onClick={() => {
            setEditIssueId("");
            setOpen();
          }}
        >
          Create a new issue
        </Button>
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
              {data?.length ? (
                data?.map((task: IssueSchema, id: number) => {
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
