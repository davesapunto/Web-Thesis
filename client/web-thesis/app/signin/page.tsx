'use client'
import Link from "next/link"
import { useRouter } from 'next/navigation';
import { initFirebase } from '../firebase_config/firebase';
import { signInWithPopup, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { useAuthState } from "react-firebase-hooks/auth";

export default function Home() {


  const app = initFirebase();
  const router = useRouter();
  const authGoogle = getAuth();
  const provider = new GoogleAuthProvider();
  const [user, loading] = useAuthState(authGoogle);
  const signIn = async() =>{
    const result = await signInWithPopup(authGoogle, provider);
  }
  if(user){
    router.push("/");
  }
  return (
    <main className = "w-[100vw] h-[100vh]">
        <div className = "w-[screen] h-[10vh] bg-[#95D2B3] flex items-center shadow-md">
          <Link href = "/" className = "ml-8">Schedule Generator</Link>
        </div>
        <div className = "flex justify-center">
          <div className = "mt-40 border border-black border-[1px] w-96 h-80 grid grid-rows-4 gap-0 justify-items-center rounded-md shadow-2xl bg-[#D8EFD3]">
            <h1 className = "mt-8">Sign in</h1>
            <div className = "ml-20">
            </div>
            <button onClick = {signIn} className = "border border-[1px] border-black h-8 w-56 rounded-md hover:bg-slate-100 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" className="mr-1">
                <path d="M 15.003906 3 C 8.3749062 3 3 8.373 3 15 C 3 21.627 8.3749062 27 15.003906 27 C 25.013906 27 27.269078 17.707 26.330078 13 L 25 13 L 22.732422 13 L 15 13 L 15 17 L 22.738281 17 C 21.848702 20.448251 18.725955 23 15 23 C 10.582 23 7 19.418 7 15 C 7 10.582 10.582 7 15 7 C 17.009 7 18.839141 7.74575 20.244141 8.96875 L 23.085938 6.1289062 C 20.951937 4.1849063 18.116906 3 15.003906 3 z"></path>
              </svg>
              <h1 className = 'mt-1'>Login with Google</h1>
            </button>
          </div>
        </div>
    </main>
  );
}
