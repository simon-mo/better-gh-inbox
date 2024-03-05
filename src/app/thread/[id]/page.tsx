"use client";

import {
  getComment,
  getComments,
  getPullRequest,
  getThread,
} from "@/utils/get-data";
import { get } from "http";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { remark } from "remark";
import html from "remark-html";
import Link from "next/link";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const markdownRenderer = remark().use(html);

function PullRequest({ data }: { data: any }) {
  const [pr, setPR] = useState<any>(null);
  const [latestComment, setLatestComment] = useState<any>(null);
  const [bodyHTML, setBodyHTML] = useState<any>(null);
  const [comments, setComments] = useState<any>(null);

  const [openCommand, setOpenCommand] = useState(false); // move this to global layout

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      // cmd + k
      if (event.metaKey && event.key === "k") {
        event.preventDefault();
        setOpenCommand(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const prID = data.url.split("/").pop();
      const result = await getPullRequest(prID);
      setPR(result);

      if (data.lastest_comment_url) {
        const comment = await getComment(
          data.lastest_comment_url.split("/").pop()
        );
        setLatestComment(comment);
      }

      const comments = await getComments(prID);
      setComments(comments);

      const markdownRendered = await markdownRenderer.process(
        result.body as string
      );

      setBodyHTML(markdownRendered);
    };
    fetchData();
  }, []);

  return (
    <div className="m-8 mx-16">
      {openCommand ? (
        <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
          <Command>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem
                  onSelect={() => {
                    setOpenCommand(false);
                    open(pr.url);
                  }}
                >
                  Open Link
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </CommandDialog>
      ) : null}

      <h1 className="text-lg">{data.title}</h1>
      <Badge>{data.reason}</Badge>

      {pr && (
        <div className="my-8">
          State: <Badge>{pr.state}</Badge>
          <br />
          <Link href={pr.url}>View on GitHub</Link>
        </div>
      )}

      {latestComment && (
        <div className="my-8">
          <h2>Latest Comment</h2>
          <p>{latestComment.body}</p>
        </div>
      )}

      <p>{JSON.stringify(data)}</p>
      <p>{JSON.stringify(pr)}</p>

      <div
        className="markdown-body border-gray-600 shadow-md p-4 rounded-md"
        dangerouslySetInnerHTML={{ __html: bodyHTML }}
      ></div>

      {comments && (
        <div>
          <h2>Comments</h2>
          {comments.map((comment: any) => (
            <div key={comment.id} className="my-4">
              {/* render the avatar */}
              <img
                className="w-8 h-8 rounded-full"
                src={comment.authorAvatarUrl}
                alt={comment.author}
              />

              {/* render the author */}
              <p className="inline ml-2">{comment.author}</p>

              <div
                className="markdown-body border-gray-600 shadow-md p-4 rounded-md"
                dangerouslySetInnerHTML={{
                  __html: markdownRenderer.processSync(comment.body),
                }}
              ></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page({ params }: { params: { id: string } }) {
  const [data, setData] = useState(null);
  const router = useRouter();

  const [prev, setPrev] = useState(null);
  const [next, setNext] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const result: any = await getThread(params.id);
      setData(result);
      const notifList = JSON.parse(
        window.sessionStorage.getItem("notifications")!
      );
      setPrev(notifList.find((notif: any) => notif.next_id === params.id)?.id);
      setNext(notifList.find((notif: any) => notif.prev_id === params.id)?.id);
    };

    fetchData();
  }, [params.id]);

  // register keyboard listener for j and k
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // if cmd is pressed, don't do anything
      if (event.metaKey) {
        return;
      }

      if (event.key === "j") {
        router.push(`/thread/${next}`);
      } else if (event.key === "k") {
        router.push(`/thread/${prev}`);
      }

      // on esc, push the user back to the main page
      else if (event.key === "Escape") {
        router.push("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [data]);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>
        {/* {data.type === "Issue" ? (
          <PullRequest data={data} />
        ) : data.type === "PullRequest" ? ( */}
        <PullRequest data={data} />
        {/* ) : (
          <div>Unknown type: {data.type}</div>
        )} */}
      </h1>
    </div>
  );
}
