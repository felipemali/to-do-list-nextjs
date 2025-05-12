import { GetStaticProps } from "next";

import Head from "next/head";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/home.module.css";
import Image from "next/image";

import heroImgs from "../../public/assets/hero.png";

import { collection, getCountFromServer, getDocs } from "firebase/firestore";
import { db } from "@/services/firebaseConnection";

type HomeProps = {
  posts: number;
  comments: number;
};

export default function Home({ posts, comments }: HomeProps) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Tarefa+ | Organize suas tarefas.</title>
      </Head>
      <main className={styles.main}>
        <div className={styles.logoContent}>
          <Image
            className={styles.hero}
            alt="logo tarefas"
            src={heroImgs}
            priority
          />
        </div>
        <h1 className={styles.title}>
          Sistema feito para você organizar
          <br /> seus estudos e tarefas
        </h1>
        <div className={styles.infoContent}>
          <section className={styles.box}>
            <span>+{posts} posts</span>
          </section>
          <section className={styles.box}>
            <span>+{comments} comentários</span>
          </section>
        </div>
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const commentRef = collection(db, "comments");
  const postRef = collection(db, "tarefas");

  const commentSnapShot = await getCountFromServer(commentRef);
  const postSnapShot = await getCountFromServer(postRef);

  return {
    props: {
      posts: postSnapShot.data().count || 0,
      comments: commentSnapShot.data().count || 0,
    },
    revalidate: 60, //revalidada a cada 60 segundos
  };
};
