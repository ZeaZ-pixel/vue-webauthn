<template>
  <v-app id="inspire">
    <v-content>
      <v-container
        class="fill-height"
        fluid
      >
        <v-row
          align="center"
          justify="center"
        >
          <v-col
            cols="12"
            sm="8"
            md="4"
          >
            <v-card class="elevation-12">
              <v-toolbar
                color="primary"
                dark
                flat
              >
                <v-toolbar-title>Login</v-toolbar-title>
                <v-spacer></v-spacer>
              </v-toolbar>
              <v-card-text>
                <v-form v-model="valid">
                  <v-text-field
                    label="Email"
                    v-model="email"
                    :rules="emailRules"
                    type="text"
                    required
                  ></v-text-field>
                  <v-text-field
                      label="Password"
                      v-model="password"
                      :rules="passwordRules"
                      type="password"
                      required
                  ></v-text-field>
                </v-form>
              </v-card-text>
              <v-card-actions>
                Don't have an account?
                <router-link to="/register">
                Sign up
                </router-link>
                <v-spacer></v-spacer>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="submit">Login</v-btn>
                <BtnForAbuLog/>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
  import BtnForAbuLog from './buttons/BtnForAbuLog'
  export default {
    name: 'LoginForm',
    components: {
      BtnForAbuLog
    },
    data: () => ({
      dialog: false,
      valid: false,
      email: '',
      emailRules: [
        v => !!v || 'E-mail is required',
        v => /.+@.+/.test(v) || 'E-mail must be valid',
      ],
      password: '',
      passwordRules: [
        v => !!v || 'Wrong password',
        v => v.length >= 8 || "The password must be greater than 8"
      ]
    }),
    methods: {
      submit() {
        let self = this;
        if (this.valid) {
          fetch(
              'http://localhost:3001/authn/login',
              {
                method: 'POST',
                headers: {
                  'content-type': 'Application/Json'
                },
                body: JSON.stringify({email: this.email, password: this.password})
              })
              .then(response => response.json())
              .then(data => {
                if (data.message) {
                  console.log(data.message);
                } else {
                  localStorage.setItem('username', data[0].email);
                  localStorage.setItem('isAuth', "true");
                  self.$router.push('/')
                }
              })
        }
      },
    }
  }
</script>
