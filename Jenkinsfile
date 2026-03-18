pipeline {
    agent any

    environment {
        GHCR_URL = 'ghcr.io/poolchaos'
        IMAGE_NAME = 'ai-chatbot-demo'
        PROD_SERVER = 'tmsanity_admin@165.73.87.59'
        DOCKER_BUILDKIT = '1'
        SERVICE_PORT = '3006'
    }

    options {
        skipDefaultCheckout(true)
        timeout(time: 45, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Memory Cleanup') {
            steps {
                script {
                    echo "=== MEMORY CLEANUP ==="
                    sh '''
                        echo "Cleaning up Docker resources..."
                        docker container prune -f 2>/dev/null || true
                        docker image prune -f 2>/dev/null || true

                        AVAILABLE_MB=$(free -m | awk 'NR==2{printf "%d", $7}')
                        echo "Available memory: ${AVAILABLE_MB}MB"

                        if [ "$AVAILABLE_MB" -lt "300" ]; then
                            echo "Insufficient memory (need 300MB+)"
                            exit 1
                        fi

                        echo "Memory check passed"
                    '''
                }
            }
        }

        stage('Checkout') {
            steps {
                echo "=== CHECKOUT CODE ==="
                deleteDir()
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    doGenerateSubmoduleConfigurations: false,
                    extensions: [
                        [$class: 'CleanBeforeCheckout'],
                        [$class: 'CloneOption', depth: 1, shallow: true]
                    ],
                    userRemoteConfigs: [[
                        url: 'https://github.com/Poolchaos/AI-Chatbot-Demo.git',
                        credentialsId: 'github-repo-access'
                    ]]
                ])

                script {
                    env.IMAGE_TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.FULL_IMAGE_NAME = "${GHCR_URL}/${IMAGE_NAME}:${env.IMAGE_TAG}"

                    sh '''
                        echo "Checkout completed"
                        echo "Image: ${FULL_IMAGE_NAME}"

                        if [ ! -f "Dockerfile" ]; then
                            echo "ERROR: Dockerfile not found!"
                            exit 1
                        fi

                        if [ ! -f "docker-compose.prod.yml" ]; then
                            echo "ERROR: docker-compose.prod.yml not found!"
                            exit 1
                        fi

                        echo "App structure verified"
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "=== BUILD DOCKER IMAGE ==="
                    echo "Building: ${env.FULL_IMAGE_NAME}"

                    sh '''
                        set -e

                        docker pull ${GHCR_URL}/${IMAGE_NAME}:latest || echo "No cache image available"

                        AVAILABLE_MB=$(free -m | awk 'NR==2{printf "%d", $7}')
                        echo "Available memory: ${AVAILABLE_MB}MB"

                        if [ "$AVAILABLE_MB" -gt "1200" ]; then
                            MEMORY_LIMIT="1024m"
                        elif [ "$AVAILABLE_MB" -gt "800" ]; then
                            MEMORY_LIMIT="800m"
                        else
                            MEMORY_LIMIT="512m"
                        fi

                        docker build \
                            --progress=plain \
                            --cache-from ${GHCR_URL}/${IMAGE_NAME}:latest \
                            --build-arg BUILDKIT_INLINE_CACHE=1 \
                            --memory=$MEMORY_LIMIT \
                            -t ${FULL_IMAGE_NAME} \
                            .

                        echo "Docker image built successfully"
                    '''
                }
            }
        }

        stage('Push to Registry') {
            steps {
                withCredentials([
                    string(credentialsId: 'GHCR_USERNAME', variable: 'GHCR_USER'),
                    string(credentialsId: 'GHCR_TOKEN', variable: 'GHCR_PAT')
                ]) {
                    script {
                        echo "=== PUSH TO REGISTRY ==="

                        sh '''
                            set -e

                            echo "${GHCR_PAT}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin
                            docker push ${FULL_IMAGE_NAME}

                            docker tag ${FULL_IMAGE_NAME} ${GHCR_URL}/${IMAGE_NAME}:latest
                            docker push ${GHCR_URL}/${IMAGE_NAME}:latest

                            echo "Image pushed successfully"
                        '''
                    }
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                withCredentials([
                    string(credentialsId: 'GHCR_USERNAME', variable: 'GHCR_USER'),
                    string(credentialsId: 'GHCR_TOKEN', variable: 'GHCR_PAT'),
                    string(credentialsId: 'CHATBOT_DEMO_GEMINI_API_KEY', variable: 'GEMINI_API_KEY')
                ]) {
                    script {
                        echo "=== DEPLOYING TO PRODUCTION ==="

                        sh '''
                            echo "Connecting to production server..."
                            ssh -o StrictHostKeyChecking=no ${PROD_SERVER} "
                                set -e
                                echo 'Starting AI Chatbot Demo deployment...'

                                # Ensure network exists
                                docker network create chatbot-demo-net 2>/dev/null || echo 'Network already exists'

                                # Login to registry
                                echo '${GHCR_PAT}' | docker login ghcr.io -u '${GHCR_USER}' --password-stdin

                                # Deploy MongoDB
                                echo 'Deploying MongoDB...'
                                docker stop chatbot-demo-mongo 2>/dev/null || echo 'No MongoDB to stop'
                                docker rm chatbot-demo-mongo 2>/dev/null || echo 'No MongoDB to remove'

                                docker run -d --name chatbot-demo-mongo \\
                                    --restart unless-stopped \\
                                    --network chatbot-demo-net \\
                                    -p 127.0.0.1:27020:27017 \\
                                    -v chatbot_demo_mongo_data:/data/db \\
                                    mongo:7

                                echo 'MongoDB deployed'

                                # Wait for MongoDB
                                echo 'Waiting for MongoDB...'
                                sleep 10

                                # Pull new app image
                                echo 'Pulling new image...'
                                docker pull ${FULL_IMAGE_NAME}

                                # Stop old app container
                                docker stop chatbot-demo-app 2>/dev/null || echo 'No running container to stop'
                                docker rm chatbot-demo-app 2>/dev/null || echo 'No container to remove'

                                # Start new app container
                                echo 'Starting app container...'
                                docker run -d --name chatbot-demo-app \\
                                    -p 127.0.0.1:3006:3000 \\
                                    --restart unless-stopped \\
                                    --network chatbot-demo-net \\
                                    -e NODE_ENV=production \\
                                    -e MONGODB_URI=mongodb://chatbot-demo-mongo:27017/elevate-offsites \\
                                    -e LLM_PROVIDER=gemini \\
                                    -e GEMINI_API_KEY='${GEMINI_API_KEY}' \\
                                    -e DAILY_REQUEST_LIMIT=100 \\
                                    -e SESSION_MESSAGE_LIMIT=20 \\
                                    -e DEMO_MODE=true \\
                                    ${FULL_IMAGE_NAME}

                                # Verify
                                echo 'Verifying containers...'
                                sleep 5
                                if docker ps --filter name=chatbot-demo-app --format '{{.Status}}' | grep -q 'Up'; then
                                    echo 'App container verified running'
                                else
                                    echo 'App container failed to start'
                                    docker logs chatbot-demo-app --tail 20 2>/dev/null || echo 'No logs available'
                                    exit 1
                                fi

                                if docker ps --filter name=chatbot-demo-mongo --format '{{.Status}}' | grep -q 'Up'; then
                                    echo 'MongoDB container verified running'
                                else
                                    echo 'MongoDB container failed to start'
                                    exit 1
                                fi

                                echo 'AI Chatbot Demo deployment completed'
                            "
                        '''

                        echo "Deployed successfully"
                    }
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo "=== POST-DEPLOY VERIFICATION ==="

                    sh '''
                        echo "Verifying deployment..."
                        ssh -o StrictHostKeyChecking=no ${PROD_SERVER} "
                            echo '=== Container Status ==='
                            docker ps --filter name=chatbot-demo

                            echo ''
                            echo '=== App Logs (last 15 lines) ==='
                            docker logs --tail 15 chatbot-demo-app

                            echo ''
                            echo '=== Health Check ==='
                            sleep 3
                            curl -sf http://127.0.0.1:3006/api/health || echo 'Health check pending...'
                        "
                    '''

                    echo "Post-deploy verification completed"
                }
            }
        }
    }

    post {
        always {
            script {
                echo "=== POST-BUILD CLEANUP ==="

                sh '''
                    set +e
                    docker container prune -f 2>/dev/null || echo "Cleanup completed"
                    docker image prune -f 2>/dev/null || echo "Image cleanup completed"
                    free -h
                '''
            }
        }
        success {
            script {
                echo "=== BUILD SUCCESS ==="
                echo "AI Chatbot Demo deployed successfully"
                echo "Access: http://165.73.87.59:${SERVICE_PORT}"
            }
        }
        failure {
            script {
                echo "=== BUILD FAILED ==="
                echo "AI Chatbot Demo build or deployment failed"
            }
        }
    }
}
