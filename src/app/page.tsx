"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getComment, getMyNotifications } from "@/utils/get-data";
import { get } from "http";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const result = await getMyNotifications();
      setData(result);

      // put the data in sessionStorage
      sessionStorage.setItem("notifications", JSON.stringify(result));
    };

    fetchData();
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl items-center justify-between flex-col">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((notification) => {
              return (
                <TableRow
                  key={notification.id}
                  onClick={() =>
                    router.push(
                      `/thread/${notification.id}?prev=${notification.prev_id}&next=${notification.next_id}`
                    )
                  }
                >
                  <TableCell>{notification.subject.title}</TableCell>
                </TableRow>
              );
              // return (
              //   <Card key={notification.id}>
              //     <CardContent>
              //       <h4 className="font-medium">{notification.subject.title}</h4>
              //     </CardContent>
              //   </Card>
              // );
            })}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
