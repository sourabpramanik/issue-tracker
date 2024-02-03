import { create } from 'zustand'

type IssueStore = {
    edit_issue_id: string,
    setEditIssueId: (id: string) => void
}
export const useIssueStore = create<IssueStore>((set) => ({
    edit_issue_id: "",
    setEditIssueId: (id: string) => set(() => ({ edit_issue_id: id })),
}))

type IssueModalStore = {
    isOpen: boolean,
    setOpen: () => void
    setClose: () => void
}
export const useIssueModalStore = create<IssueModalStore>((set) => ({
    isOpen: false,
    setOpen: () => set({ isOpen: true }),
    setClose: () => set({ isOpen: false }),
}))