import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Bug,
  CheckCircle,
  Circle,
  Edit,
  File,
  HelpCircle,
  Loader,
  Rocket,
  Timer,
  Trash2,
} from "lucide-react";
import { TaskSchema } from ".";
import { useGetUser } from "@/lib/hooks";

const statusIcon = {
  todo: <Circle className="mr-2 h-4 w-4 text-muted-foreground" />,
  inprogress: <Timer className="mr-2 h-4 w-4 text-muted-foreground" />,
  done: <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" />,
  backlog: <HelpCircle className="mr-2 h-4 w-4 text-muted-foreground" />,
};
const labelIcon = {
  bug: <Bug className="mr-2 h-4 w-4 text-muted-foreground" />,
  feature: <Rocket className="mr-2 h-4 w-4 text-muted-foreground" />,
  documentation: <File className="mr-2 h-4 w-4 text-muted-foreground" />,
};

const Row = ({ task }: { task: TaskSchema }) => {
  const userData = useGetUser(task.author);
  return (
    <TableRow>
      <TableCell width={"200px"}>
        {userData.isLoading ? (
          <Loader className="w-3 h-3 animate-spin" />
        ) : (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={userData.data?.avatar} />
              <AvatarFallback>{userData.data?.username}</AvatarFallback>
            </Avatar>
            <p className="font-medium">{userData.data?.username}</p>
          </div>
        )}
      </TableCell>
      <TableCell>{task.title}</TableCell>
      <TableCell width={"300px"}>{task.description}</TableCell>
      <TableCell width={"150px"}>
        <div className="flex items-center">
          {statusIcon[task.status]}
          <span>{task.status.toUpperCase()}</span>
        </div>
      </TableCell>
      <TableCell width={"150px"}>
        <div className="flex items-center">
          {labelIcon[task.label]}
          <span>{task.label.toUpperCase()}</span>
        </div>
      </TableCell>
      <TableCell width={"100px"}>
        <div className="flex items-center gap-4">
          <Edit className="w-4 h-4" />
          <Trash2 className="w-4 h-4" />
        </div>
      </TableCell>
    </TableRow>
  );
};

export default Row;
