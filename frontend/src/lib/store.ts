import { create } from 'zustand'
import { IssueSchema } from './schema'


type IssueStore = {
    issue: IssueSchema,
    updateIssue: (updatedIssue: IssueSchema) => void
}
export const useStore = create<IssueStore>((set) => ({
    issue: {
        id: "",
        title: "",
        description: "",
        status: "todo",
        label: "bug",
        author: ""
    },
    updateIssue: (updatedTask: IssueSchema) => set((state) => ({ issue: { ...state.issue, ...updatedTask } })),
}))