import { SignIn, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import UsersTable from "@/components/issue-table";

function App() {
  return (
    <main>
      <SignedOut>
        <SignIn />
      </SignedOut>
      <SignedIn>
        <div className="p-20 flex flex-col items-center space-y-7">
          <div className="fixed top-6 right-6">
            <UserButton afterSignOutUrl="/" />
          </div>
          <UsersTable />
        </div>
      </SignedIn>
    </main>
  );
}

export default App;
