"use client";

import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function Form() {
  const router = useRouter();
  const session = useSession();

  const handleGithubSignIn = async () => {
    await signIn("github", { callbackUrl: "/" });
  };

  useEffect(() => {
    if (session?.status === "authenticated") {
      router.replace("/");
    }
  }, [session, router]);

  return (
    <div className="login-bg flex justify-center items-start lg:items-center w-screen h-screen mt-10 lg:mt-0 bg-cover bg-no-repeat bg-center">
      <div className="w-full max-w-md">
        <div className="login-container shadow-2xl w-[95%] lg:w-[450px]">
          <div className="flex flex-col items-center justify-center p-8">
            <h1 className="text-xl lg:text-2xl font-bold text-center mb-8 uppercase">
              Sign in to CheckMate
            </h1>
            <button
              onClick={handleGithubSignIn}
              className="login-btn github w-full"
              type="button"
            >
              <FontAwesomeIcon icon={faGithub} className="w-[20px] h-[20px]" />
              Sign in with GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
