import useSWR, { Fetcher } from "swr"
import useSWRMutation from 'swr/mutation'
import { IssueSchema } from "./schema";
import { toast } from "sonner";
import { useIssueModalStore } from "./store";

export type User = {
    id: string,
    first_name: string,
    last_name: string,
    username: string,
    avatar: string,
}
export const useGetUser = (user_id: string | undefined) => {
    const fetcher: Fetcher<User, string> = (url) => fetch(url).then(res => res.json())
    const { isLoading, data } = useSWR(`/api/user/${user_id}`, fetcher);

    return { isLoading, data };
}

export const useGetIssues = () => {
    const fetcher: Fetcher<IssueSchema[], string> = () =>
        fetch("/api/issues").then((res) => res.json())
    const { isLoading, data } = useSWR("/api/issue", fetcher);
    return { isLoading, data };
}

export const useGetIssue = (id: string) => {
    const fetcher: Fetcher<{ data: IssueSchema }, string> = (url) =>
        fetch(url).then((res) => res.json())
    const { data } = useSWR(() => id !== "" ? `/api/issue/${id}` : null, fetcher);

    return { data: data?.data }
}

export const useCreateIssue = () => {
    const { setClose } = useIssueModalStore();

    const create = (url: string, { arg }: { arg: Omit<IssueSchema, "id"> }) => fetch(url, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(arg),
    }).then(res => res.json())

    const { isMutating, trigger } = useSWRMutation("/api/issue", create, {
        onSuccess() {
            toast.success("Issue has been created.");
            setClose();
        },
        onError(err) {
            if (err.message) {
                toast.error(err.message);
            } else {
                toast.error("Falied to create the issue.");
            }
        },
    })

    return { isMutating, trigger }
}

export const useEditIssue = () => {
    const { setClose } = useIssueModalStore();

    const edit = (url: string, { arg }: { arg: IssueSchema }) => fetch(`${url}/${arg.id}`, {
        method: "PATCH",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(arg),
    }).then(res => res.json())

    const { isMutating, trigger } = useSWRMutation("/api/issue", edit, {
        onSuccess() {
            toast.success("Issue has been updated.");
            setClose();
        },
        onError(err) {
            if (err.message) {
                toast.error(err.message);
            } else {
                toast.error("Falied to update the issue.");
            }
        },
    })

    return { isMutating, trigger }
}

export const useDeleteIssue = () => {
    const { setClose } = useIssueModalStore();

    const remove = (url: string, { arg }: { arg: { id: string } }) => fetch(`${url}/${arg.id}`, {
        method: "DELETE",
    }).then(res => res.json())

    const { isMutating, trigger } = useSWRMutation("/api/issue", remove, {
        onSuccess() {
            toast.success("Issue has been deleted.");
            setClose();
        },
        onError(err) {
            if (err.message) {
                toast.error(err.message);
            } else {
                toast.error("Falied to delete the issue.");
            }
        },
    })

    return { isMutating, trigger }
}