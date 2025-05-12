import Head from "next/head";
import styles from "./styles.module.css";
import { GetServerSideProps } from "next";

import { db } from "@/services/firebaseConnection";
import {
  doc,
  collection,
  query,
  where,
  getDoc,
  addDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

import { Textarea } from "@/components/textarea";
import { useSession } from "next-auth/react";
import { ChangeEvent, FormEvent, useState } from "react";
import { FaTrash } from "react-icons/fa";

type CommentsProps = {
  id: string;
  comment: string;
  taskId: string;
  user: string;
  name: string;
};

type Taskprops = {
  task: {
    tarefa: string;
    created: string;
    public: boolean;
    user: string;
    taskId: string;
  };
  allComments: CommentsProps[];
};

export default function Task({ task, allComments }: Taskprops) {
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const [comments, setComments] = useState<CommentsProps[] | []>(
    allComments || []
  );

  async function handleComment(event: FormEvent) {
    event.preventDefault();
    if (input === "") return;

    if (!session?.user?.email || !session?.user?.name) return;

    try {
      const docRef = await addDoc(collection(db, "comments"), {
        comment: input,
        created: new Date(),
        user: session?.user?.email,
        name: session?.user?.name,
        taskId: task?.taskId,
      });

      const data = {
        id: docRef.id,
        comment: input,
        user: session?.user?.email,
        name: session?.user?.name,
        taskId: task?.taskId,
      };

      setComments((oldTasks) => [...oldTasks, data]);

      setInput("");
    } catch (err) {
      console.log(err);
    }
  }
  async function handleDeleteComment(id: string) {
    try {
      const docRef = doc(db, "comments", id);
      await deleteDoc(docRef);

      const deleteComment = comments.filter((comment) => comment.id !== id);
      setComments(deleteComment);
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <div className={styles.container}>
      <Head>
        <title>Detalhes da tarefa</title>
      </Head>
      <main className={styles.main}>
        <h1>Tarefa</h1>
        <article className={styles.task}>
          <p>{task.tarefa}</p>
        </article>
      </main>

      <section className={styles.commentsContainer}>
        <h2>Deixar Comentário</h2>

        <form onSubmit={handleComment}>
          <Textarea
            value={input}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              setInput(event.target.value)
            }
            placeholder="Digite seu comentário..."
          />
          <button disabled={!session?.user} className={styles.button}>
            Enviar Comentário
          </button>
        </form>
      </section>

      <section className={styles.commentsContainer}>
        <h2>Todos Comentários</h2>
        {comments.length === 0 && (
          <span>Nenhum comentário foi encontrado...</span>
        )}
        {comments.map((item) => (
          <article key={item.id} className={styles.comment}>
            <div className={styles.headComment}>
              <label htmlFor="" className={styles.commentsLabel}>
                {item.name}
              </label>
              {item.user === session?.user?.email && (
                <button
                  className={styles.buttonTrash}
                  onClick={() => handleDeleteComment(item.id)}
                >
                  <FaTrash size={18} color="#ea3140" />
                </button>
              )}
            </div>
            <p>{item.comment}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id as string;

  const docRef = doc(db, "tarefas", id);

  //trazendo todos comentários da tarefa
  const q = query(collection(db, "comments"), where("taskId", "==", id));
  const snapShotComments = await getDocs(q);
  const allComments = snapShotComments.docs.map((doc) => ({
    id: doc.id as string,
    comment: doc.data().comment as string,
    user: doc.data().user as string,
    name: doc.data().name as string,
    taskId: doc.data().taskId as string,
  }));

  console.log(allComments);

  //**----- */

  const snapshot = await getDoc(docRef);
  if (snapshot.data() === undefined || !snapshot.data()?.public) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const miliseconds = snapshot.data()?.created.seconds * 1000;
  const task = {
    tarefa: snapshot.data()?.tarefa as string,
    public: snapshot.data()?.public as boolean,
    created: new Date(miliseconds).toLocaleDateString(),
    user: snapshot.data()?.user as string,
    taskId: id,
  };

  return {
    props: {
      task,
      allComments,
    },
  };
};
