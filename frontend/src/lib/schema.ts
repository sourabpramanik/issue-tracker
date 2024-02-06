export interface IssueSchema {
    id: string | undefined,
    title: string;
    description: string;
    status: "todo" | "inprogress" | "done" | "backlog";
    label: "bug" | "feature" | "documentation";
    author: string;
}

export interface UserSchema {
    id: string,
    first_name: string,
    last_name: string,
    username: string,
    profile_image_url: string,
}