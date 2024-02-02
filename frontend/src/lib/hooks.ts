import useSWR, { Fetcher } from "swr"

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

export const useGetTasks = () => {
    const { isLoading, data } = useSWR("/api/tasks", (url) =>
        fetch(url).then((res) => res.json())
    );
    return { isLoading, data };

}