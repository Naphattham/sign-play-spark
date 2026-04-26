import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { database } from "@/lib/firebase";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  points: number;
  photoURL?: string;
}

export function useLeaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {

        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);


        
        if (snapshot.exists()) {
          const users: LeaderboardEntry[] = [];
          snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();

            users.push({
              id: childSnapshot.key as string,
              rank: 0,
              username: userData.username || userData.displayName || 'Anonymous',
              points: userData.points || 0,
              photoURL: userData.photoURL,
            });
          });

          users.sort((a, b) => b.points - a.points);
          users.forEach((user, index) => {
            user.rank = index + 1;
          });


          setLeaderboardData(users);
        } else {

        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch leaderboard"));
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return { leaderboardData, loading, error };
}
