export interface IssueSchema {
    id: string | undefined,
    title: string;
    description: string;
    status: "todo" | "inprogress" | "done" | "backlog";
    label: "bug" | "feature" | "documentation";
    author: string;
}