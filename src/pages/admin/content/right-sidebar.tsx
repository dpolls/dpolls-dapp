import { Mail, Dice5, Trophy } from "lucide-react"
import { Button } from "@/components/ui_v3/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui_v3/card"
import { Badge } from "antd"

interface RightSidebarProps {
  isMobile: boolean
}

export default function RightSidebar({ isMobile }: RightSidebarProps) {
  return (
    <div className="h-full py-4 px-3 flex flex-col gap-4">
      <h2 className="px-4 text-lg font-semibold">Quick Access</h2>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            Envelope Game
          </CardTitle>
          <CardDescription>Interactive envelope game</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge.Ribbon text="Soon">
            <Button variant="outline" size="sm" className="w-full" disabled>
              Play Now
            </Button>
          </Badge.Ribbon>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Dice5 className="mr-2 h-4 w-4" />
            D&D Games
          </CardTitle>
          <CardDescription>Dungeons & Dragons games</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge.Ribbon text="Soon">
            <Button variant="outline" size="sm" className="w-full" disabled>
              View Games
            </Button>
          </Badge.Ribbon>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </CardTitle>
          <CardDescription>Top poll participants</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge.Ribbon text="Soon">
            <Button variant="outline" size="sm" className="w-full" disabled>
              View Leaderboard
            </Button>
            </Badge.Ribbon>
        </CardContent>
      </Card>

      {/* {!isMobile && (
        <div className="mt-auto">
          <Card className="bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xs">
                  <p className="font-medium">New poll created</p>
                  <p className="text-muted-foreground">2 minutes ago</p>
                </div>
                <div className="text-xs">
                  <p className="font-medium">5 new responses</p>
                  <p className="text-muted-foreground">15 minutes ago</p>
                </div>
                <div className="text-xs">
                  <p className="font-medium">Poll "Game Night" ended</p>
                  <p className="text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )} */}
    </div>
  )
}
