import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useUser } from "@clerk/clerk-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "lucide-react";
import { useIssueModalStore, useIssueStore } from "@/lib/store";
import { useCreateIssue, useEditIssue, useGetIssue } from "@/lib/hooks";
import { useEffect } from "react";

const status = ["todo", "inprogress", "done", "backlog"] as const;
const label = ["bug", "feature", "documentation"] as const;
const formSchema = z.object({
  title: z.string().min(3, {
    message: "title must be at least 3 characters.",
  }),
  description: z.string().min(5, {
    message: "title must be at least 5 characters.",
  }),
  status: z.enum(status, {
    required_error: "You need to select a status.",
  }),
  label: z.enum(label, {
    required_error: "You need to select a label.",
  }),
  author: z.string({ required_error: "Author is required" }),
});

export default function IssueDialog() {
  const { isOpen, setClose } = useIssueModalStore();
  return (
    <Dialog open={isOpen} onOpenChange={() => setClose()}>
      <DialogContent className="rounded-md">
        <IssueCard />
      </DialogContent>
    </Dialog>
  );
}

export function IssueCard() {
  const { user } = useUser();
  const { edit_issue_id } = useIssueStore();
  const { data: issue } = useGetIssue(edit_issue_id);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      label: "bug",
      author: user?.id,
    },
  });

  useEffect(() => {
    if (issue) {
      form.setValue("title", issue.title);
      form.setValue("description", issue.description);
      form.setValue("status", issue.status);
      form.setValue("label", issue.label);
    }
  }, [issue]);
  const { isMutating: createMutating, trigger: createTrigger } =
    useCreateIssue();
  const { isMutating: editMutating, trigger: editTrigger } = useEditIssue();

  function onSubmit(values: z.infer<typeof formSchema>) {
    edit_issue_id === ""
      ? createTrigger(values)
      : editTrigger({ id: edit_issue_id, ...values });
  }
  const noAuth = edit_issue_id !== "" && user?.id !== issue?.author;
  return (
    <Card className="border-0 bg-background">
      <CardHeader>
        <CardTitle>Report an issue</CardTitle>
        <CardDescription>
          What area are you having problems with?
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              disabled={noAuth}
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              disabled={noAuth}
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter the description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        disabled={noAuth}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue
                            placeholder="Select a status"
                            className="text-xs"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {status.map((item, id) => (
                            <FormItem key={id}>
                              <FormControl>
                                <SelectItem value={item} className="text-xs">
                                  {item.toUpperCase()}
                                </SelectItem>
                              </FormControl>
                            </FormItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        disabled={noAuth}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue
                            placeholder="Select a label"
                            className="text-xs"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {label.map((item, id) => (
                            <FormItem key={id}>
                              <FormControl>
                                <SelectItem value={item} className="text-xs">
                                  {item.toUpperCase()}
                                </SelectItem>
                              </FormControl>
                            </FormItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {!noAuth && (
              <Button type="submit">
                {(createMutating || editMutating) && (
                  <Loader className="w-3 h-3 animate-spin" />
                )}
                Submit
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
