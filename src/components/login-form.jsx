import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import LoginSchema from "@/schema/login";
import { login } from "@/service/auth";
import { useState } from "react";
import { useNavigate } from "react-router";

export function LoginForm({ className, ...props }) {
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(LoginSchema),
    reValidateMode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmitHandle = async (data) => {
    try {
      const dataUser = await login(data.username);

      if (dataUser.length === 0 || dataUser[0].password !== data.password) {
        setErrorMessage("Username atau password salah");

        return;
      }

      localStorage.setItem("userActive", dataUser[0].id);

      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmitHandle)}>
            <FieldGroup>
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input
                      {...field}
                      id="username"
                      type="username"
                      placeholder="username"
                      required
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="password"
                      type="password"
                      placeholder="******"
                      required
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {errorMessage && (
                <p className="text-red-500 text-sm">{errorMessage}</p>
              )}
              <Field>
                <Button type="submit">Login</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
