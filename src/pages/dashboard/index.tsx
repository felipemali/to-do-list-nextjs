import styles from "@/pages/dashboard/styles.module.css";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import Head from "next/head";

import { getSession } from "next-auth/react";
import { Textarea } from "@/components/textarea/";
import { FiShare2 } from "react-icons/fi";
import { FaTrash } from "react-icons/fa";

import { db } from "@/services/firebaseConnection";
import {
  addDoc,
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import Link from "next/link";

type DashBoardProps = {
  user: {
    email: string;
  };
};
export type TasksProps = {
  id: string;
  created: Date;
  public: boolean;
  tarefa: string;
  user: string;
};

export default function Dashboard({ user }: DashBoardProps) {
  const [input, setInput] = useState("");
  const [publicTask, setPublicTask] = useState(false);
  const [tasks, setTasks] = useState<TasksProps[]>([]);

  useEffect(() => {
    async function loadTasks() {
      const tasksRef = collection(db, "tarefas");
      const q = query(
        tasksRef,
        orderBy("created", "desc"),
        where("user", "==", user?.email)
      );

      onSnapshot(q, (snapshot) => {
        const taskList = snapshot.docs.map((doc) => ({
          id: doc.id,
          tarefa: doc.data().tarefa,
          created: doc.data().created,
          user: doc.data().user,
          public: doc.data().public,
        }));
        setTasks(taskList);
      });
    }

    loadTasks();
  }, [user?.email]);

  function handleChangePublic(event: ChangeEvent<HTMLInputElement>) {
    setPublicTask(event.target.checked);
  }
  async function handleRegisterTask(event: FormEvent) {
    event.preventDefault();

    if (input === "") return;

    try {
      await addDoc(collection(db, "tarefas"), {
        tarefa: input,
        created: new Date(),
        user: user?.email,
        public: publicTask,
      });

      setInput("");
      setPublicTask(false);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleShare(id: string) {
    //copiar o link através do click
    await navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_URL}/task/${id}`
    );
  }
  async function hnadleDeleteTask(id: string) {
    const docRef = doc(db, "tarefas", id);

    await deleteDoc(docRef);
  }
  return (
    <div className={styles.container}>
      <Head>
        <title>Meu painel de tarefas</title>
      </Head>
      <main className={styles.main}>
        <section className={styles.content}>
          <div className={styles.contentForm}>
            <h1 className={styles.title}>Qual sua tarefa?</h1>

            <form action="" onSubmit={handleRegisterTask}>
              <Textarea
                placeholder="Digite qual sua tarefa"
                value={input}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setInput(event.target.value)
                }
              />
              <div className={styles.checkboxArea}>
                <input
                  type="checkbox"
                  name=""
                  id=""
                  className={styles.checkbox}
                  checked={publicTask}
                  onChange={handleChangePublic}
                />
                <label htmlFor="">Deixar a tarefa pública</label>
              </div>
              <button type="submit" className={styles.button}>
                Registar
              </button>
            </form>
          </div>
        </section>

        <section className={styles.taskContainer}>
          <h1>Minhas tarefas</h1>

          {tasks.map((task) => (
            <article className={styles.task} key={task.id}>
              {task.public && (
                <div className={styles.tagContainer}>
                  <label htmlFor="" className={styles.tag}>
                    PUBLICO
                  </label>
                  <button className={styles.shareButton}>
                    <FiShare2
                      onClick={() => handleShare(task.id)}
                      size={22}
                      color="#3183ff"
                    />
                  </button>
                </div>
              )}
              <div className={styles.taskContent}>
                {task?.public ? (
                  <Link href={`/task/${task.id}`}>
                    <p>{task.tarefa}</p>
                  </Link>
                ) : (
                  <p>{task.tarefa}</p>
                )}
                <button className={styles.trashButton}>
                  <FaTrash
                    onClick={() => hnadleDeleteTask(task.id)}
                    size={24}
                    color="#ea3140"
                  />
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });

  if (!session?.user) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  return {
    props: {
      user: {
        email: session?.user?.email,
      },
    },
  };
};
