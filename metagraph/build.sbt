name := "consentire-metagraph"

version := "1.0.0"

scalaVersion := "2.13.12"

// TODO: Add Constellation L0 framework dependencies when available
// libraryDependencies += "org.constellation" %% "l0-sdk" % "1.0.0"

libraryDependencies ++= Seq(
  "org.scala-lang.modules" %% "scala-collection-compat" % "2.11.0",
  "org.scalatest" %% "scalatest" % "3.2.16" % Test
)

scalacOptions ++= Seq(
  "-deprecation",
  "-feature",
  "-unchecked",
  "-Xlint",
  "-Ywarn-dead-code",
  "-Ywarn-unused"
)
